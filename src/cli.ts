import { Command } from "commander";
import { checkConfigCompatibility } from "./checker";
import { extract } from "./extract";

const program = new Command();

program
  .command("compare")
  .option("-o, --old <string>", "Path for old eslint config")
  .option("-n, --new <string>", "Path for new eslint config")
  .option(
    "-e, --ext <string>",
    "File extensions to apply lint. (like: 'js,ts,jsx,tsx')",
  )
  .action((options) => {
    checkConfigCompatibility(options.old || ".", options.new || ".", {
      extensions: options.ext,
    });
  });

program
  .command("extract")
  .option("-c, --config <string>", "Path for eslint config")
  .option(
    "-e, --ext <string>",
    "File extensions to apply lint. (like: 'js,ts,jsx,tsx')",
  )
  .option("-o, --output <string>", "Path for output file")
  .action((options) => {
    extract(options.config || ".", options.output || "data.json", {
      extensions: options.ext,
    });
  });

program
  .command("compare-with-extracted")
  .option("-c, --config <string>", "Path for eslint config")
  .option("-i, --import-path <string>", "Path for extracted file")
  .option(
    "-e, --ext <string>",
    "File extensions to apply lint. (like: 'js,ts,jsx,tsx')",
  )
  .action((option) => {
    //
  });

program.parse();
