import { Command } from "commander";
import { generateOldConfigCompatData } from "./generateOldConfigCompatData";
import { compareWithCompatInfo } from "./compareWithCompatInfo";

const program = new Command();

program
  .command("extract")
  .option("-c, --config <string>", "Path for eslint config")
  .option(
    "-e, --ext <string>",
    "File extensions to apply lint. (like: 'js,ts,jsx,tsx')",
  )
  .option("-o, --output <string>", "Path for output file")
  .option("-r, --overrides <string>", "Override patterns")
  .option("-t, --target <string>", "target directory")
  .action((options) => {
    if (!options.config) {
      console.error("Config path is required.");
      return;
    }
    generateOldConfigCompatData({
      configPath: options.config,
      outputPath: options.output,
      targetDir: options.target,
      supportExtensions: options.ext.split(","),
    });
  });

program
  .command("compare")
  .option("-c, --config <string>", "Path for eslint config")
  .option("-i, --import-path <string>", "Path for extracted file")
  .option("-t, --target-dir <string>", "Target directory to lint")
  .option("-r, --target-dir <string>", "Path to generate report file")
  .action((options) => {
    if (!options.config) {
      console.error("Config path is required.");
      return;
    }
    compareWithCompatInfo({
      configPath: options.config,
      compatFilePath: options.importPath,
      targetDir: options.targetDir,
    });
  });

program.parse();
