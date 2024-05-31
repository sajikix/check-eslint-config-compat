import { cosmiconfig } from "cosmiconfig";
import { Config, Rules } from "./types";

import { ESLint } from "eslint";
import { isSameLanguageOptions, isSameRules, normalizeRules } from "./utils";

export const extractRules = async ({
  configPath,
  targetFilePaths,
}: {
  configPath: string;
  targetFilePaths: string[];
}) => {
  const configSearchResult = await cosmiconfig("eslint", {
    searchPlaces: [configPath],
  }).search();
  const config = configSearchResult?.config;
  const ruleSettings = new Map<string, Config>();
  const eslint = new ESLint({ overrideConfig: config });
  for (const targetFilePath of targetFilePaths) {
    const calculated = await eslint.calculateConfigForFile(targetFilePath);

    if ([...ruleSettings.keys()].length === 0) {
      console.log("calculated", calculated);

      console.log({
        ecmaVersion: calculated.parserOptions?.ecmaVersion,
        sourceType: calculated.parserOptions?.sourceType,
        globals: calculated.globals,
        parserOptions: calculated.parserOptions,
      });

      ruleSettings.set(targetFilePath, {
        rules: normalizeRules(calculated.rules),
        languageOptions: {
          ecmaVersion: calculated.parserOptions?.ecmaVersion,
          sourceType: calculated.parserOptions?.sourceType,
          globals: calculated.globals,
          parserOptions: calculated.parserOptions,
        },
        settings: calculated?.settings,
      });
    } else {
      const hasSameRuleSettings = [...ruleSettings.values()].some(
        (ruleConfig) => {
          return (
            isSameRules(ruleConfig.rules, calculated.rules) &&
            isSameLanguageOptions(
              ruleConfig.languageOptions,
              calculated.languageOptions,
            )
          );
        },
      );
      if (!hasSameRuleSettings) {
        ruleSettings.set(targetFilePath, {
          rules: normalizeRules(calculated.rules),
          languageOptions: calculated.languageOptions,
        });
      }
    }
  }
  return ruleSettings;
};
