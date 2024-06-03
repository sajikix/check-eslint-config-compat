import { cosmiconfig } from "cosmiconfig";
import { ESLint } from "eslint";
import omit from "lodash/omit";
import { FilesConfig } from "./types";
import { isSameLanguageOptions, isSameRules, normalizeRules } from "./utils";
import globals from "globals";

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
    const calculatedGlobals = {
      ...calculated.globals,
      ...Object.entries(calculated?.env)
        .filter(([, value]) => value)
        .map(([key]) => key)
        .reduce((acc, key) => {
          // @ts-ignore
          return { ...acc, ...globals[key] };
        }, {}),
    };
    const calculatedParserOptions = omit(calculated.parserOptions, [
      "ecmaVersion",
      "sourceType",
    ]);
    const sameConfigIndex = ruleSettings.findIndex((ruleConfig) => {
      const newLanguageOptions = {
        ecmaVersion: calculated.parserOptions?.ecmaVersion,
        sourceType: calculated.parserOptions?.sourceType,
        globals: calculatedGlobals,
        parserOptions: calculatedParserOptions,
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
            globals: calculatedGlobals,
            parserOptions: calculatedParserOptions,
          },
          settings: calculated?.settings,
        },
      ];
    }
  }
  return ruleSettings;
};
