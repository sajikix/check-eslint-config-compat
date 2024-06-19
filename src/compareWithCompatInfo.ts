import { glob } from "glob";
import { lstat, readFile, unlink, writeFile } from "node:fs/promises";
import pico from "picocolors";
import { compareConfigs } from "./compareConfigs";
import { compareTargetFilePaths } from "./compareTarget";
import { errors } from "./errors";
import { getTargetFilePaths } from "./getTargetFilePaths";
import { CompatInfo } from "./types";
import { getTempFilePath } from "./utils";
import { validateConfig } from "./validateConfig";
import { minimatch } from "minimatch";

type Options = {
  configPath: string;
  compatFilePath: string;
  supportExtensions?: string[];
  targetDir?: string;
  overridePatterns?: string[];
};

export const compareWithCompatInfo = async ({
  configPath,
  compatFilePath = "./.compat.json",
  targetDir = "./src",
}: Options) => {
  const compatFileJson = await readFile(compatFilePath, "utf-8");
  const compatInfo = JSON.parse(compatFileJson) as CompatInfo;
  const { supportExtensions } = compatInfo;
  const targetDirStat = await lstat(targetDir);
  const isDir = targetDirStat.isDirectory();

  const testFilePath = isDir ? getTempFilePath(targetDir) : "./__temp.js";
  await writeFile(testFilePath, "");

  const targetPattern = isDir
    ? `${targetDir}**/*.{${supportExtensions.join(",")}}`
    : targetDir;

  try {
    const targetFiles = await glob([targetPattern], {
      ignore: "node_modules/**",
    });
    if (targetFiles.length === 0) {
      console.error(pico.red("🚨 No target files found"));
      return;
    }

    console.log("🔍 Check ESLint config compatibility...");

    console.log("============================");
    console.log(pico.blue("Step1. Check config is valid."));
    await validateConfig(configPath, true, testFilePath);
    await unlink(testFilePath);
    errors.reportInvalidConfig();

    console.log("============================");
    console.log(pico.blue("Step2. compare lint targets."));
    const targets = await getTargetFilePaths({
      configPath,
      isFlatConfig: true,
      extensions: supportExtensions,
      targetDir: targetDir,
    });
    const filteredTargets = targets.filter(
      (target) => !minimatch(target, "**/eslint.config.js"),
    );
    errors.reportGetTargetFilesFailed();
    compareTargetFilePaths(compatInfo.targets, filteredTargets);
    errors.reportDifferentTargetFiles();

    console.log("============================");
    console.log(pico.blue("Step3. Get rule-sets for each file"));
    await compareConfigs(configPath, compatInfo);
    errors.reportDifferentRules();

    console.log("============================");
    console.log(pico.blue("Result"));
    errors.hasNoErrors()
      ? console.log(
          pico.green("🎉 Same rule is applied as before in all files."),
        )
      : console.log(pico.red("🚨 check failed"));
  } catch (e) {
    console.error(pico.red("incompatible with compatInfo...."), e);
  }
};
