import { cosmiconfig } from "cosmiconfig";
import { glob } from "glob";
import { uniq } from "lodash";
import { TEMP_FILE_PATH } from "./constants";
import { ConfigInfo } from "./types";
import pico from "picocolors";
import { exec as actualExec } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(actualExec);

type Rules = {
  [rule: string]: [
    0 | 1 | 2 | "off" | "warn" | "error",
    ...Array<Record<string, unknown>>,
  ];
};

export const extractRules = async (configMeta: ConfigInfo) => {
  const configSearchResult = await cosmiconfig("eslint", {
    searchPlaces: [configMeta.configPath],
  }).search();

  const config = configSearchResult?.config;
  const configPath = configSearchResult?.filepath;

  let flatConfigFilesPatterns: string[] = [];
  let overridePatterns: string[] = [];

  if (configMeta.isFlatConfig && configPath) {
    flatConfigFilesPatterns = [
      ...flatConfigFilesPatterns,
      ...(await getFlatConfigFiles(configPath)),
    ];
  } else {
    const configOverrides =
      (config?.overrides as Array<{
        files: string[];
        rules: Record<string, unknown>;
      }>) || [];
    overridePatterns = [
      ...overridePatterns,
      ...configOverrides.map((override) => override.files).flat(),
    ];
  }

  const ruleTestFilePaths: string[] = [];

  for (const pattern of uniq(overridePatterns)) {
    const files = await glob(pattern, {
      ignore: "node_modules/**",
    });
    files.length > 0 && ruleTestFilePaths.push(files[0]);
  }

  for (const pattern of uniq(flatConfigFilesPatterns)) {
    const files = await glob(pattern, {
      ignore: "node_modules/**",
    });
    files.length > 0 && ruleTestFilePaths.push(files[0]);
  }

  console.log("Check difference of rules in following paths.");

  const ruleSets: Array<{ path: string; rules: Rules }> = [];

  for (const ruleTestFilePath of uniq([...ruleTestFilePaths, TEMP_FILE_PATH])) {
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
      rules: JSON.parse(rulesStdout).rules,
    });
  }

  return ruleSets;
};
type FlatConfig = Array<{
  files?: string[];
  rules: Record<string, unknown>;
}>;
const getFlatConfigFiles = async (configPath: string) => {
  const configModule = await import(configPath);
  const configObject = (await configModule.default) as FlatConfig;
  return configObject
    .map((config) => config.files)
    .filter((files) => !!files)
    .flat() as string[];
};
