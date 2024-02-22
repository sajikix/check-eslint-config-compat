import pico from "picocolors";
import { checkRuleDiff } from "./checkRuleDiff";
import { TEMP_FILE_PATH } from "./constants";
import { isFlatConfig } from "./isFlatConfig";
import { validateConfig } from "./validateConfig";
import { writeFile, unlink } from "node:fs/promises";
import { getTargetFilePaths } from "./compareTarget";
import { extractRules } from "./extractRules";

type ExtractOptions = {
  extensions?: string[];
};

export const extract = async (
  configPath: string,
  output: string,
  options?: Partial<ExtractOptions>,
) => {
  await writeFile(TEMP_FILE_PATH, "");

  try {
    const isConfigFlat = await isFlatConfig(configPath);

    const extensions = options?.extensions || ["js"];
    console.log("🔍 Check ESLint config compatibility...");
    console.log("============================");
    console.log(pico.blue("Step1. Check each configs are valid."));
    await validateConfig(configPath, isConfigFlat);
    console.log("============================");
    console.log(pico.blue("Step2. Get lint targets."));
    const targets = await getTargetFilePaths({
      configPath,
      isFlatConfig: isConfigFlat,
      extensions,
      targetDir: "./",
    });
    console.log("============================");
    console.log(pico.blue("Step3. Check ruleset are same."));
    const ruleSets = await extractRules({
      configPath: configPath,
      isFlatConfig: isConfigFlat,
    });
    console.log("============================");

    console.log(targets, ruleSets);

    await writeFile(output, JSON.stringify({ targets, ruleSets }, null, "\t"));

    console.log(pico.green("🎉 rule settings art extracted!"));
  } catch (e) {
    console.error(pico.red("Check failed...."));
  } finally {
    await unlink(TEMP_FILE_PATH);
  }
};
