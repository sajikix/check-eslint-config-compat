import { cosmiconfig } from "cosmiconfig";
import { glob } from "glob";
import arrayDiff from "lodash/difference";
import isEqual from "lodash/isEqual";
import uniq from "lodash/uniq";
import { exec as actualExec, spawn } from "node:child_process";
import { promisify } from "node:util";
import pico from "picocolors";

const exec = promisify(actualExec);

type GetTargetFilePathsArgs = {
  configPath: string;
  extensions: string[];
  targetDir: string;
  isFlatConfig: boolean;
};

const getTargetFilePaths = async ({
  configPath,
  extensions,
  targetDir,
  isFlatConfig,
}: GetTargetFilePathsArgs): Promise<string[]> => {
  return new Promise(function (resolve, reject) {
    console.log(
      `Search target files in ${pico.bold(
        isFlatConfig ? "new" : "old"
      )} config.`
    );
    console.log(pico.white(`  - configPath: ${configPath}`));
    console.log(pico.white(`  - extensions: ${extensions.join(",")}`));
    console.log(pico.white(`  - targetDir: ${targetDir}`));
    console.log(pico.white(`  - isFlatConfig: ${isFlatConfig}`));
    let outputs = "";
    const lint = spawn(
      "npx",
      [
        "-c",
        `'ESLINT_USE_FLAT_CONFIG=${isFlatConfig} eslint ${targetDir} --ext ${extensions.join(
          ","
        )} --config ${configPath} --debug'`,
      ],
      { shell: true }
    );
    const grep = spawn("grep", ['"Parsing\\ssuccessful:"'], {
      shell: true,
    });
    lint.stderr.pipe(grep.stdin);
    process.stdout.write("  ");

    grep.stdout.on("data", (data) => {
      process.stdout.write(".");
      outputs = `${outputs}${data.toString()}`;
    });
    grep.stderr.on("data", (data) => {
      reject([]);
    });
    grep.stdout.on("close", (code) => {
      console.log("Finished listing target files!");
      resolve(
        outputs
          .split("\n")
          .map((line) => line.split("Parsing successful: ")[1])
          .filter((line) => !!line)
          .slice()
          .sort()
      );
    });
  });
};

type FlatConfig = Array<{
  files?: string[];
  rules: Record<string, unknown>;
}>;

const getFlatConfigFiles = (flatConfig: FlatConfig) => {
  return flatConfig
    .map((config) => config.files)
    .filter((files) => !!files)
    .flat() as string[];
};

const checkRuleDiff = async (
  oldConfigMeta: ConfigInfo,
  newConfigMeta: ConfigInfo
) => {
  const oldConfigSearchResult = await cosmiconfig("eslint", {
    searchPlaces: [oldConfigMeta.configPath],
  }).search();

  const oldConfig = oldConfigSearchResult?.config;

  const newConfigSearchResilt = await cosmiconfig("eslint", {
    searchPlaces: [newConfigMeta.configPath],
  }).search();

  const newConfig = newConfigSearchResilt?.config;

  let flatConfigFilesPatterns: string[] = [];
  let overridePatterns: string[] = [];

  if (oldConfigMeta.isFlatConfig) {
    flatConfigFilesPatterns = [
      ...flatConfigFilesPatterns,
      ...getFlatConfigFiles(oldConfig),
    ];
  } else {
    const oldConfigOverrides = oldConfig?.overrides || [];
    overridePatterns = [
      ...overridePatterns,
      ...oldConfigOverrides.map((override) => override.files).flat(),
    ];
  }

  if (newConfigMeta.isFlatConfig) {
    flatConfigFilesPatterns = [
      ...flatConfigFilesPatterns,
      ...getFlatConfigFiles(newConfig),
    ];
  } else {
    const newConfigOverrides = newConfig?.overrides || [];
    overridePatterns = [
      ...overridePatterns,
      ...newConfigOverrides.map((override) => override.files).flat(),
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

  for (const ruleTestFilePath of ruleTestFilePaths) {
    console.log(`  - ${ruleTestFilePath}`);
    const { stdout: oldRulesStdout } = await exec(
      `ESLINT_USE_FLAT_CONFIG=${oldConfigMeta.isFlatConfig} npx eslint --print-config ${ruleTestFilePath} --config ${oldConfigMeta.configPath}`
    );

    if (oldRulesStdout.startsWith("undefined")) {
      console.error(
        pico.red("🚨 ESLint has not been applied to this file in old config")
      );
      console.error(pico.red(`  - ${ruleTestFilePath}`));
      process.exit(1);
    }
    const oldRules = JSON.parse(oldRulesStdout).rules;

    const { stdout: newRulesStdout } = await exec(
      `ESLINT_USE_FLAT_CONFIG=${newConfigMeta.isFlatConfig} npx eslint --print-config ${ruleTestFilePath} --config ${newConfigMeta.configPath}`
    );

    if (newRulesStdout.startsWith("undefined")) {
      console.error(
        pico.red("🚨 ESLint has not been applied to this file in new config")
      );
      console.error(pico.red(`  - ${ruleTestFilePath}`));
      process.exit(1);
    }
    const newRules = JSON.parse(newRulesStdout).rules;

    if (!isSameRules(oldRules, newRules)) {
      process.exit(1);
    }
  }
  console.log(pico.green("✅ No difference in lint rules"));
};

const isSameSeverities = (
  oldSeverities: 0 | 1 | 2 | "off" | "warn" | "error",
  newSeverities: 0 | 1 | 2 | "off" | "warn" | "error"
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

const isSameRules = (oldRules, newRules) => {
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
            `  - value in old config is "${oldRules[key][0]}", but in new config it is "${newRules[key][0]}".`
          )
        );
        return false;
      }
      for (let i = 1; i < oldRules[key].length; i++) {
        if (!isEqual(oldRules[key][i], newRules[key][i])) {
          console.error(pico.red("🚨 There is a difference in lint rules"));
          console.error(
            pico.red(`  - ${oldRules[key]} rule options are different.`)
          );
          return false;
        }
      }
    }
  }
  return true;
};

const compareTargetFilePaths = async (
  oldConfigMeta: ConfigInfo,
  newConfigMeta: ConfigInfo,
  extensions: string[]
) => {
  const oldTargetFilePaths = await getTargetFilePaths({
    configPath: oldConfigMeta.configPath,
    isFlatConfig: oldConfigMeta.isFlatConfig,
    extensions: extensions,
    targetDir: "./",
  });

  const newTargetFilePaths = await getTargetFilePaths({
    configPath: newConfigMeta.configPath,
    isFlatConfig: newConfigMeta.isFlatConfig,
    extensions: extensions,
    targetDir: "./",
  });

  const decrements = arrayDiff(oldTargetFilePaths, newTargetFilePaths);
  const increments = arrayDiff(newTargetFilePaths, oldTargetFilePaths);

  if (increments.length + decrements.length > 0) {
    console.error(pico.red("🚨 There is a difference in lint targets"));
    increments.length > 0 &&
      console.error(
        pico.red("following files are increased as lint targets..."),
        [
          ...increments.slice(0, 10),
          increments.length > 10 &&
            `...and ${increments.length - 10} more files`,
        ]
      );
    decrements.length > 0 &&
      console.error(
        pico.red("following files are reduced as lint targets..."),
        [
          ...decrements.slice(0, 10),
          decrements.length > 10 &&
            `...and ${decrements.length - 10} more files`,
        ]
      );
    process.exit(1);
  }
  console.log(pico.green("✅ No difference in lint targets"));

  return true;
};

type ConfigInfo = {
  configPath: string;
  isFlatConfig: boolean;
};

type CheckConfigCompatibilityOptions = {
  extensions?: string[];
};

const checkConfigFile = async (configPath: string, isFlatConfig: boolean) => {
  console.log(`target : ${configPath}`);
  try {
    await exec(
      `ESLINT_USE_FLAT_CONFIG=${isFlatConfig} npx eslint ${configPath} --config ${configPath}`
    );
  } catch (e) {
    const errorMessages = e?.stderr
      ?.split("\n")
      .filter((line) => line !== "") as string[];
    console.error(
      pico.red("🚨 ESLint config is invalid. Detailed errors are as follows.")
    );
    errorMessages.forEach((message) => {
      console.error(pico.red(`  ${message}`));
    });
    process.exit(1);
  } finally {
    console.log(pico.green("✅ This config is valid."));
  }
};

const isFlatConfig = async (configPath: string) => {
  const configSearchResult = await cosmiconfig("eslint", {
    searchPlaces: [configPath],
  }).search();

  return Array.isArray(configSearchResult.config);
};

export const checkConfigCompatibility = async (
  oldConfigPath: string,
  newConfigPath: string,
  options?: Partial<CheckConfigCompatibilityOptions>
) => {
  const isOldConfigFlat = await isFlatConfig(oldConfigPath);
  const isNewConfigFlat = await isFlatConfig(newConfigPath);
  const extensions = options?.extensions || ["js"];
  console.log("🔍 Check ESLint config compatibility...");
  console.log("============================");
  console.log(pico.blue("Step1. Check each configs are valid"));
  await checkConfigFile(oldConfigPath, isOldConfigFlat);
  await checkConfigFile(newConfigPath, isNewConfigFlat);
  console.log("============================");
  console.log(pico.blue("Step2. Check lint targets are same"));
  await compareTargetFilePaths(
    { configPath: oldConfigPath, isFlatConfig: isOldConfigFlat },
    { configPath: newConfigPath, isFlatConfig: isNewConfigFlat },
    extensions
  );
  console.log("============================");
  console.log(pico.blue("Step3. Check ruleset are same"));
  await checkRuleDiff(
    { configPath: oldConfigPath, isFlatConfig: isOldConfigFlat },
    { configPath: newConfigPath, isFlatConfig: isNewConfigFlat }
  );
  console.log("============================");
  console.log(pico.green("🎉 All checks are passed!"));
};
