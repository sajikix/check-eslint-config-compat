import { cosmiconfig } from "cosmiconfig";
import { glob } from "glob";
import { uniq } from "lodash";
import { ConfigInfo, Rules } from "./types";

import { ESLint } from "eslint";

export const extractRules = async ({
  configPath,
  overridePatterns,
  targetSampleFilePath,
}: ConfigInfo) => {
  const configSearchResult = await cosmiconfig("eslint", {
    searchPlaces: [configPath],
  }).search();

  const config = configSearchResult?.config;
  const configOverrides =
    (config?.overrides as Array<{
      files: string[];
      rules: Record<string, unknown>;
    }>) || [];
  overridePatterns = [
    ...overridePatterns,
    ...configOverrides.map((override) => override.files).flat(),
  ];
  const ruleTestFilePaths: string[] = [targetSampleFilePath];
  const eslint = new ESLint({ overrideConfigFile: configPath });

  for (const pattern of uniq(overridePatterns)) {
    const files = await glob(pattern, {
      ignore: "node_modules/**",
    });
    files.length > 0 && ruleTestFilePaths.push(files[0]);
  }

  console.log("Check difference of rules in following paths.");
  const ruleSets: Array<{ path: string; rules: Rules }> = [];
  for (const ruleTestFilePath of uniq([...ruleTestFilePaths])) {
    console.log(`  - ${ruleTestFilePath}`);

    const calculated =
      await eslint.calculateConfigForFile(targetSampleFilePath);
    ruleSets.push({
      path: ruleTestFilePath,
      rules: normalizeRules(calculated.rules),
    });
  }
  return ruleSets;
};

const normalizeRules = (rules: Rules): Rules => {
  // eslint-disable-next-line node/no-unsupported-features/es-builtins
  return Object.fromEntries(
    Object.entries(rules).map(([ruleName, value]) => {
      return [ruleName, [mapSeverities(value[0]), ...value.slice(1)]];
    }),
  ) as Rules;
};

const mapSeverities = (value: string | number): 0 | 1 | 2 => {
  if (typeof value === "number") {
    return value as 0 | 1 | 2;
  } else if (value === "off") {
    return 0;
  } else if (value === "warn") {
    return 1;
  }
  return 2;
};
