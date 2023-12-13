import pico from "picocolors";
import { checkRuleDiff } from "./checkRuleDiff";
import { compareTargetFilePaths } from "./compareTarget";
import { isFlatConfig } from "./isFlatConfig";
import { validateConfig } from "./validateConfig";

type CheckConfigCompatibilityOptions = {
  extensions?: string[];
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
  console.log(pico.blue("Step1. Check each configs are valid."));
  await validateConfig(oldConfigPath, isOldConfigFlat);
  await validateConfig(newConfigPath, isNewConfigFlat);
  console.log("============================");
  console.log(pico.blue("Step2. Check lint targets are same."));
  await compareTargetFilePaths(
    { configPath: oldConfigPath, isFlatConfig: isOldConfigFlat },
    { configPath: newConfigPath, isFlatConfig: isNewConfigFlat },
    extensions
  );
  console.log("============================");
  console.log(pico.blue("Step3. Check ruleset are same."));
  await checkRuleDiff(
    { configPath: oldConfigPath, isFlatConfig: isOldConfigFlat },
    { configPath: newConfigPath, isFlatConfig: isNewConfigFlat }
  );
  console.log("============================");
  console.log(pico.green("🎉 All checks are passed!"));
};
