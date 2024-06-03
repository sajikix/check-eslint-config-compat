import { cosmiconfig } from "cosmiconfig";
import { FilesConfig, Rules } from "./types";
import omit from "lodash/omit";

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
  let ruleSettings = new Array<FilesConfig>();

  const eslint = new ESLint({ overrideConfig: config });
  for (const targetFilePath of targetFilePaths) {
    const calculated = await eslint.calculateConfigForFile(targetFilePath);
    const sameConfigIndex = ruleSettings.findIndex((ruleConfig) => {
      const newLanguageOptions = {
        ecmaVersion: calculated.parserOptions?.ecmaVersion,
        sourceType: calculated.parserOptions?.sourceType,
        globals: calculated.globals,
        parserOptions: calculated.parserOptions,
      };

      return (
        isSameRules(ruleConfig.rules, calculated.rules) &&
        isSameLanguageOptions(ruleConfig.languageOptions, newLanguageOptions)
      );
    });

    if (ruleSettings.length !== 0 && sameConfigIndex >= 0) {
      ruleSettings[sameConfigIndex].targetFilePaths.push(targetFilePath);
    } else {
      ruleSettings = [
        ...ruleSettings,
        {
          key: targetFilePath,
          targetFilePaths: [targetFilePath],
          rules: normalizeRules(calculated.rules),
          languageOptions: {
            ecmaVersion: calculated.parserOptions?.ecmaVersion,
            sourceType: calculated.parserOptions?.sourceType,
            globals: calculated.globals,
            parserOptions: omit(calculated.parserOptions, [
              "ecmaVersion",
              "sourceType",
            ]),
          },
          settings: calculated?.settings,
          env: calculated?.env,
        },
      ];
    }
  }
  return ruleSettings;
};
