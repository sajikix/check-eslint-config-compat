import path from "node:path";
import { LanguageOptions, Rules } from "./types";
import arrayDiff from "lodash/difference";
import isEqual from "lodash/isEqual";

export const TEMP_FILE_PATH = "_temp.js";

export const getTempFilePath = (dir: string) => path.join(dir, TEMP_FILE_PATH);

export const DEFAULT_COMPAT_DATA_FILE_PATH = "./.compat.json";

export const normalizeRules = (rules: Rules): Rules => {
  // eslint-disable-next-line node/no-unsupported-features/es-builtins
  return Object.fromEntries(
    Object.entries(rules).map(([ruleName, value]) => {
      return [ruleName, [mapSeverities(value[0]), ...value.slice(1)]];
    }),
  ) as Rules;
};

export const mapSeverities = (value: string | number): 0 | 1 | 2 => {
  if (typeof value === "number") {
    return value as 0 | 1 | 2;
  } else if (value === "off") {
    return 0;
  } else if (value === "warn") {
    return 1;
  }
  return 2;
};

export const isSameSeverities = (
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

export const isSameRules = (oldRules: Rules, newRules: Rules) => {
  const oldRuleKeys = Object.keys(oldRules);
  const newRuleKeys = Object.keys(newRules);

  const decrements = arrayDiff(oldRuleKeys, newRuleKeys);
  const increments = arrayDiff(newRuleKeys, oldRuleKeys);
  if (increments.length + decrements.length > 0) {
    return false;
  }
  for (const key of oldRuleKeys) {
    if (oldRules[key].length > 0 && newRules[key].length > 0) {
      if (!isSameSeverities(oldRules[key][0], newRules[key][0])) {
        return false;
      }
      for (let i = 1; i < oldRules[key].length; i++) {
        if (!isEqual(oldRules[key][i], newRules[key][i])) {
          return false;
        }
      }
    }
  }
  return true;
};

export const isSameLanguageOptions = (
  oldOptions: LanguageOptions,
  newOptions: LanguageOptions,
) => {
  // check ecmaVersion is same
  if (oldOptions?.ecmaVersion !== newOptions?.ecmaVersion) {
    return false;
  }
  // check sourceType is same
  if (oldOptions?.sourceType !== newOptions?.sourceType) {
    return false;
  }
  // check globals is same
  if (oldOptions?.globals === undefined && newOptions?.globals !== undefined) {
    return false;
  }
  if (newOptions?.globals === undefined && oldOptions?.globals !== undefined) {
    return false;
  }

  if (!!oldOptions?.globals && !!newOptions?.globals) {
    const oldGlobalKeys = Object.keys(oldOptions.globals);
    const newGlobalKeys = Object.keys(newOptions.globals);
    const decrements = arrayDiff(oldGlobalKeys, newGlobalKeys);
    const increments = arrayDiff(newGlobalKeys, oldGlobalKeys);
    if (increments.length + decrements.length > 0) {
      return false;
    }
    for (const key of oldGlobalKeys) {
      if (oldOptions.globals[key] !== newOptions.globals[key]) {
        return false;
      }
    }
  }
  // check parserOptions is same
  if (!isEqual(oldOptions?.parserOptions, newOptions?.parserOptions)) {
    return false;
  }
  // all options are same
  return true;
};
