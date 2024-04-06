import { cosmiconfig } from "cosmiconfig";
import { glob } from "glob";
import { uniq } from "lodash";
import { ConfigInfo, Rules } from "./types";
import pico from "picocolors";
import { exec as actualExec } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(actualExec);

export const extractRules = async (configMeta: ConfigInfo) => {
  const configSearchResult = await cosmiconfig("eslint", {
    searchPlaces: [configMeta.configPath],
  }).search();

  const config = configSearchResult?.config;

  let overridePatterns: string[] = configMeta.overridePatterns;

  const configOverrides =
    (config?.overrides as Array<{
      files: string[];
      rules: Record<string, unknown>;
    }>) || [];
  overridePatterns = [
    ...overridePatterns,
    ...configOverrides.map((override) => override.files).flat(),
  ];

  const ruleTestFilePaths: string[] = [configMeta.targetSampleFilePath];

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
    const { stdout: rulesStdout } = await exec(
      `ESLINT_USE_FLAT_CONFIG=${configMeta.isFlatConfig} npx eslint --print-config ${ruleTestFilePath} --config ${configMeta.configPath}`,
    );
    if (rulesStdout.startsWith("undefined")) {
      console.error(
        pico.red("🚨 ESLint has not been applied to this file in config"),
      );
      console.error(pico.red(`  - ${ruleTestFilePath}`));
      throw new Error();
    }
    ruleSets.push({
      path: ruleTestFilePath,
      rules: normalizeRules(JSON.parse(rulesStdout).rules),
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
