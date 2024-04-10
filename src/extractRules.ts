import { cosmiconfig } from "cosmiconfig";
import { Rules } from "./types";

import { ESLint } from "eslint";
import { isSameRules, normalizeRules } from "./utils";

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
  const ruleSettings = new Map<string, Rules>();
  const eslint = new ESLint({ overrideConfig: config });
  for (const targetFilePath of targetFilePaths) {
    const calculated = await eslint.calculateConfigForFile(targetFilePath);
    if ([...ruleSettings.keys()].length === 0) {
      ruleSettings.set(targetFilePath, normalizeRules(calculated.rules));
    } else {
      const hasSameRuleSettings = [...ruleSettings.values()].some(
        (ruleSetting) => {
          return isSameRules(ruleSetting, calculated.rules);
        },
      );
      if (!hasSameRuleSettings) {
        ruleSettings.set(targetFilePath, normalizeRules(calculated.rules));
      }
    }
  }
  return ruleSettings;
};
