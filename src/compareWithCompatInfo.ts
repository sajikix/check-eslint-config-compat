import { glob } from "glob";
import { lstat, readFile, unlink, writeFile } from "node:fs/promises";
import pico from "picocolors";
import { compareRules } from "./compareRules";
import { compareTargetFilePaths } from "./compareTarget";
import { errors } from "./errors";
import { getTargetFilePaths } from "./getTargetFilePaths";
import { CompatInfo } from "./types";
import { getTempFilePath } from "./utils";
import { validateConfig } from "./validateConfig";

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
  targetDir = "./",
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
    errors.invalidConfig && errors.reportInvalidConfig();

    console.log("============================");
    console.log(pico.blue("Step2. compare lint targets."));
    const targets = await getTargetFilePaths({
      configPath,
      isFlatConfig: true,
      extensions: supportExtensions,
      targetDir: targetDir,
    });
    errors.getTargetFilesFailed && errors.reportGetTargetFilesFailed();
    compareTargetFilePaths(compatInfo.targets, targets);
    errors.differentTargetFiles && errors.reportDifferentTargetFiles();

    console.log("============================");
    console.log(pico.blue("Step3. Get rule-sets for each file"));
    await compareRules(configPath, compatInfo.ruleSets);

    errors.reportDifferentRules();

    console.log(pico.green("🎉 successfully checked"));
  } catch (e) {
    console.error(pico.red("Check failed...."));
  }
};
