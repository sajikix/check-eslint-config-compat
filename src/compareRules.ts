import arrayDiff from "lodash/difference";
import isEqual from "lodash/isEqual";
import pico from "picocolors";
import { CompatInfo, LanguageOptions } from "./types";

import assert, { AssertionError } from "node:assert/strict";

// @ts-ignore
import { FlatESLint } from "eslint/use-at-your-own-risk";
import { errors } from "./errors";
import { isSameSeverities } from "./utils";

// eslint-disable-next-line max-statements
export const compareRules = async (
  configPath: string,
  compatInfo: CompatInfo,
) => {
  console.log("Check difference of rules in following paths.");
  const eslint = new FlatESLint({ overrideConfigFile: configPath });
  let hasNoDiffs = true;

  for (const config of compatInfo.filesConfig) {
    for (const targetFilePath of config.targetFilePaths) {
      console.log(`  - ${targetFilePath}`);

      const calculated = await eslint.calculateConfigForFile(targetFilePath);

      hasNoDiffs = checkSameRules(
        targetFilePath,
        config.rules,
        calculated.rules,
      );

      hasNoDiffs = checkSameLanguageOptions(
        targetFilePath,
        config.languageOptions,
        calculated.languageOptions,
      );
    }
  }
  hasNoDiffs && console.log(pico.green("✅ No difference in lint rules"));
};

type Rules = {
  [rule: string]: [
    0 | 1 | 2 | "off" | "warn" | "error",
    ...Array<Record<string, unknown>>,
  ];
};

const checkSameLanguageOptions = (
  filePath: string,
  oldLanguageOptions: LanguageOptions,
  newLanguageOptions: LanguageOptions,
) => {
  let hasNoDiff = true;
  if (newLanguageOptions.ecmaVersion !== oldLanguageOptions.ecmaVersion) {
    hasNoDiff = false;
    errors.setDifferentLanguageOptions(filePath, {
      type: "ecmaVersion",
      oldOption: oldLanguageOptions.ecmaVersion,
      newOption: newLanguageOptions.ecmaVersion,
    });
  }
  if (newLanguageOptions.sourceType !== oldLanguageOptions.sourceType) {
    hasNoDiff = false;
    errors.setDifferentLanguageOptions(filePath, {
      type: "sourceType",
      oldOption: oldLanguageOptions.sourceType,
      newOption: newLanguageOptions.sourceType,
    });
  }
  if (!isEqual(newLanguageOptions.globals, oldLanguageOptions.globals)) {
    hasNoDiff = false;
    errors.setDifferentLanguageOptions(filePath, {
      type: "globals",
      oldOption: oldLanguageOptions.globals,
      newOption: newLanguageOptions.globals,
    });
  }

  if (
    !isEqual(newLanguageOptions.parserOptions, oldLanguageOptions.parserOptions)
  ) {
    hasNoDiff = false;
    errors.setDifferentLanguageOptions(filePath, {
      type: "parserOptions",
      oldOption: oldLanguageOptions.parserOptions,
      newOption: newLanguageOptions.parserOptions,
    });
  }

  return hasNoDiff;
};

const checkSameRules = (filePath: string, oldRules: Rules, newRules: Rules) => {
  let hasNoDiff = true;
  const oldRuleKeys = Object.keys(oldRules);
  const newRuleKeys = Object.keys(newRules);

  const decrements = arrayDiff(oldRuleKeys, newRuleKeys);
  const increments = arrayDiff(newRuleKeys, oldRuleKeys);
  if (increments.length + decrements.length > 0) {
    hasNoDiff = false;
    errors.setRulesIncreaseDecrease(
      filePath,
      decrements.length > 0 ? decrements : undefined,
      increments.length > 0 ? increments : undefined,
    );
  }

  for (const key of oldRuleKeys) {
    if (oldRules[key].length > 0 && newRules[key] && newRules[key].length > 0) {
      if (!isSameSeverities(oldRules[key][0], newRules[key][0])) {
        hasNoDiff = false;
        errors.setRulesDifferentSeverities(
          filePath,
          key,
          oldRules[key][0],
          newRules[key][0],
        );
      }
      for (let i = 1; i < oldRules[key].length; i++) {
        if (!isEqual(oldRules[key][i], newRules[key][i])) {
          hasNoDiff = false;
          errors.setRulesDifferentOptions(
            filePath,
            key,
            // @ts-ignore
            oldRules[key][i],
            newRules[key][i],
          );
        }
      }
    }
  }

  return hasNoDiff;
};
