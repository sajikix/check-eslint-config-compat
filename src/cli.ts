import { Command } from "commander";
// import { checkConfigCompatibility } from "./checker";
import { generateOldConfigCompatData } from "./generateOldConfigCompatData";
import { compareWithCompatInfo } from "./compareWithCompatInfo";

const program = new Command();

// program
//   .command("compare")
//   .option("-o, --old <string>", "Path for old eslint config")
//   .option("-n, --new <string>", "Path for new eslint config")
//   .option(
//     "-e, --ext <string>",
//     "File extensions to apply lint. (like: 'js,ts,jsx,tsx')",
//   )
//   .action((options) => {
//     checkConfigCompatibility(options.old || ".", options.new || ".", {
//       extensions: options.ext,
//     });
//   });

program
  .command("extract")
  .option("-c, --config <string>", "Path for eslint config")
  .option(
    "-e, --ext <string>",
    "File extensions to apply lint. (like: 'js,ts,jsx,tsx')",
  )
  .option("-o, --output <string>", "Path for output file")
  .option("-r, --overrides <string>", "Override patterns")
  .action((options) => {
    if (!options.config) {
      console.error("Config path is required.");
      return;
    }
    generateOldConfigCompatData({
      configPath: options.config,
      outputPath: options.output,
      supportExtensions: options.ext.split(","),
    });
  });

program
  .command("compare")
  .option("-c, --config <string>", "Path for eslint config")
  .option("-i, --import-path <string>", "Path for extracted file")
  .option("-t, --target-dir <string>", "Target directory to lint")
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
