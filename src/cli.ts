import { Command } from "commander";
import { checkConfigCompatibility } from "./checker";

const program = new Command();

program
  .option("-o, --old <string>", "Path for old eslint config")
  .option("-n, --new <string>", "Path for new eslint config")
  .option(
    "-e, --ext <string>",
    "File extensions to apply lint. (like: 'js,ts,jsx,tsx')"
  )
  .action((options) => {
    checkConfigCompatibility(options.old || ".", options.new || ".", {
      extensions: options.ext,
    });
  });

program.parse();
