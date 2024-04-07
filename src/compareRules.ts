import arrayDiff from "lodash/difference";
import isEqual from "lodash/isEqual";
import { exec as actualExec } from "node:child_process";
import { promisify } from "node:util";
import pico from "picocolors";
import { RuleSet } from "./types";

// @ts-ignore
import { FlatESLint } from "eslint/use-at-your-own-risk";
import { errors } from "./errors";

const exec = promisify(actualExec);

// eslint-disable-next-line max-statements
export const compareRules = async (
  configPath: string,
  compatInfoRuleSets: RuleSet[],
) => {
  console.log("Check difference of rules in following paths.");
  const eslint = new FlatESLint({ overrideConfigFile: configPath });

  for (const ruleSet of compatInfoRuleSets) {
    console.log(`  - ${ruleSet.path}`);
    const calculated = await eslint.calculateConfigForFile(ruleSet.path);
    if (!isSameRules(ruleSet.path, ruleSet.rules, calculated.rules)) {
      return;
    }
  }
  console.log(pico.green("✅ No difference in lint rules"));
};

const isSameSeverities = (
  oldSeverities: 0 | 1 | 2 | "off" | "warn" | "error",
  newSeverities: 0 | 1 | 2 | "off" | "warn" | "error",
) => {
  if (oldSeverities === newSeverities) {
    return true;
  }
  if (
    [0, "off"].includes(oldSeverities) &&
    [0, "off"].includes(newSeverities)
  ) {
    return true;
  }
  if (
    [1, "warn"].includes(oldSeverities) &&
    [1, "warn"].includes(newSeverities)
  ) {
    return true;
  }
  if (
    [2, "error"].includes(oldSeverities) &&
    [2, "error"].includes(newSeverities)
  ) {
    return true;
  }
  return false;
};

type Rules = {
  [rule: string]: [
    0 | 1 | 2 | "off" | "warn" | "error",
    ...Array<Record<string, unknown>>,
  ];
};

const isSameRules = (filePath: string, oldRules: Rules, newRules: Rules) => {
  const oldRuleKeys = Object.keys(oldRules);
  const newRuleKeys = Object.keys(newRules);

  const decrements = arrayDiff(oldRuleKeys, newRuleKeys);
  const increments = arrayDiff(newRuleKeys, oldRuleKeys);
  if (increments.length + decrements.length > 0) {
    errors.setRulesIncreaseDecrease(
      filePath,
      decrements.length > 0 ? decrements : undefined,
      increments.length > 0 ? increments : undefined,
    );
    return false;
  }
  for (const key of oldRuleKeys) {
    if (oldRules[key].length > 0 && newRules[key].length > 0) {
      if (!isSameSeverities(oldRules[key][0], newRules[key][0])) {
        errors.setRulesDifferentSeverities(
          filePath,
          key,
          oldRules[key][0],
          newRules[key][0],
        );
        return false;
      }
      for (let i = 1; i < oldRules[key].length; i++) {
        if (!isEqual(oldRules[key][i], newRules[key][i])) {
          errors.setRulesDifferentOptions(
            filePath,
            key,
            // @ts-ignore
            oldRules[key][i],
            newRules[key][i],
          );
          return false;
        }
      }
    }
  }
  return true;
};
