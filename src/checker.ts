import pico from "picocolors";
import { checkRuleDiff } from "./checkRuleDiff";
import { compareTargetFilePaths } from "./compareTarget";
import { isFlatConfig } from "./isFlatConfig";
import { validateConfig } from "./validateConfig";
import { writeFile, unlink } from "node:fs/promises";
import { TEMP_FILE_PATH } from "./constants";

type CheckConfigCompatibilityOptions = {
  extensions?: string[];
};

export const checkConfigCompatibility = async (
  oldConfigPath: string,
  newConfigPath: string,
  options?: Partial<CheckConfigCompatibilityOptions>,
) => {
  await writeFile(TEMP_FILE_PATH, "");

  try {
    const isOldConfigFlat = await isFlatConfig(oldConfigPath);
    const isNewConfigFlat = await isFlatConfig(newConfigPath);
    const extensions = options?.extensions || ["js"];
    console.log("🔍 Check ESLint config compatibility...");
    console.log("============================");
    console.log(pico.blue("Step1. Check each configs are valid."));
    await validateConfig(oldConfigPath, isOldConfigFlat);
    await validateConfig(newConfigPath, isNewConfigFlat);
    console.log("============================");
    console.log(pico.blue("Step2. Check lint targets are same."));
    await compareTargetFilePaths(
      { configPath: oldConfigPath, isFlatConfig: isOldConfigFlat },
      { configPath: newConfigPath, isFlatConfig: isNewConfigFlat },
      extensions,
    );
    console.log("============================");
    console.log(pico.blue("Step3. Check ruleset are same."));
    await checkRuleDiff(
      { configPath: oldConfigPath, isFlatConfig: isOldConfigFlat },
      { configPath: newConfigPath, isFlatConfig: isNewConfigFlat },
    );
    console.log("============================");
    console.log(pico.green("🎉 All checks are passed!"));
  } catch (e) {
    console.error(pico.red("Check failed...."));
  } finally {
    await unlink(TEMP_FILE_PATH);
  }
};
