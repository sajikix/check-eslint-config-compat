import pico from "picocolors";
import { DEFAULT_COMPAT_DATA_FILE_PATH, TEMP_FILE_PATH } from "./utils";
import { validateConfig } from "./validateConfig";
import { writeFile, unlink, readdir, lstat } from "node:fs/promises";
import { extractRules } from "./extractRules";
import { getTargetFilePaths } from "./getTargetFilePaths";
import { glob } from "glob";

type Options = {
  configPath: string;
  outputPath?: string;
  supportExtensions?: string[];
  targetDir?: string;
  overridePatterns?: string[];
};

export const generateOldConfigCompatData = async ({
  supportExtensions = ["js"],
  configPath,
  outputPath = DEFAULT_COMPAT_DATA_FILE_PATH,
  targetDir = "./",
  overridePatterns = [],
}: Options) => {
  console.log("supportExtensions", supportExtensions);

  const targetDirStat = await lstat(targetDir);
  const isDir = targetDirStat.isDirectory();
  const testFilePath = isDir ? `${targetDir}_temp.js` : "./_temp.js";
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
    console.log(pico.blue("Step1. Check each configs are valid."));
    await validateConfig(configPath, false, testFilePath);
    await unlink(testFilePath);
    console.log("============================");
    console.log(pico.blue("Step2. Get lint targets."));
    const targets = await getTargetFilePaths({
      configPath,
      isFlatConfig: false,
      extensions: supportExtensions,
      targetDir: targetDir,
    });
    console.log("============================");
    console.log(pico.blue("Step3. Get rule-sets for each file"));
    const ruleSets = await extractRules({
      configPath: configPath,
      isFlatConfig: false,
      targetSampleFilePath: targetFiles[0],
      overridePatterns,
    });
    console.log("============================");
    await writeFile(
      outputPath,
      JSON.stringify({ targets, ruleSets, supportExtensions }),
    );
    console.log(pico.green("🎉 rule settings art extracted!"));
  } catch (e) {
    console.error(pico.red("Check failed...."));
  }
};
