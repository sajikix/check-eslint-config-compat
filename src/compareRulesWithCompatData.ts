import arrayDiff from "lodash/difference";
import isEqual from "lodash/isEqual";
import { exec as actualExec } from "node:child_process";
import { promisify } from "node:util";
import pico from "picocolors";
import { RuleSet } from "./types";

const exec = promisify(actualExec);

// eslint-disable-next-line max-statements
export const compareRulesWithCompatData = async (
  configPath: string,
  compatInfoRuleSets: RuleSet[],
) => {
  console.log("Check difference of rules in following paths.");

  for (const ruleSet of compatInfoRuleSets) {
    console.log(`  - ${ruleSet.path}`);
    const { stdout: newRulesStdout } = await exec(
      `ESLINT_USE_FLAT_CONFIG=true npx eslint --print-config ${ruleSet.path} --config ${configPath}`,
    );

    if (newRulesStdout.startsWith("undefined")) {
      console.error(
        pico.red("🚨 ESLint has not been applied to this file in new config"),
      );
      console.error(pico.red(`  - ${ruleSet.path}`));
      throw new Error();
    }
    const newRules = JSON.parse(newRulesStdout).rules;

    if (!isSameRules(ruleSet.rules, newRules)) {
      throw new Error();
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

const isSameRules = (oldRules: Rules, newRules: Rules) => {
  const oldRuleKeys = Object.keys(oldRules);
  const newRuleKeys = Object.keys(newRules);

  const decrements = arrayDiff(oldRuleKeys, newRuleKeys);
  const increments = arrayDiff(newRuleKeys, oldRuleKeys);
  if (increments.length + decrements.length > 0) {
    console.error(pico.red("🚨 There are differences in lint rules"));
    console.error(pico.red(`  - Adapted ruleset is different`));
    if (increments.length > 0) {
      console.error(pico.red("  - following rules are increased."));
      console.error([
        ...increments.slice(0, 10),
        increments.length > 10 && `...and ${increments.length - 10} more rules`,
      ]);
    }
    if (decrements.length > 0) {
      console.error(pico.red("  - following rules are reduced."));
      console.error([
        ...decrements.slice(0, 10),
        decrements.length > 10 && `...and ${decrements.length - 10} more rules`,
      ]);
    }
    return false;
  }
  for (const key of oldRuleKeys) {
    if (oldRules[key].length > 0 && newRules[key].length > 0) {
      if (!isSameSeverities(oldRules[key][0], newRules[key][0])) {
        console.error(pico.red("🚨 There is a difference in lint rules"));
        console.error(pico.red(`  - Severity for "${key}" rule is different.`));
        console.error(
          pico.red(
            `  - value in old config is "${oldRules[key][0]}", but in new config it is "${newRules[key][0]}".`,
          ),
        );
        return false;
      }
      for (let i = 1; i < oldRules[key].length; i++) {
        if (!isEqual(oldRules[key][i], newRules[key][i])) {
          console.error(pico.red("🚨 There is a difference in lint rules"));
          console.error(
            pico.red(`  - ${oldRules[key]} rule options are different.`),
          );
          return false;
        }
      }
    }
  }
  return true;
};
