import { spawn } from "node:child_process";
import pico from "picocolors";

type GetTargetFilePathsArgs = {
  configPath: string;
  extensions: string[];
  targetDir: string;
  isFlatConfig: boolean;
};

export const getTargetFilePaths = async ({
  configPath,
  extensions,
  targetDir,
  isFlatConfig,
}: GetTargetFilePathsArgs): Promise<string[]> => {
  return new Promise(function (resolve, reject) {
    console.log(
      `Search target files in ${pico.bold(
        isFlatConfig ? "new" : "old",
      )} config.`,
    );
    console.log(pico.white(`  - configPath: ${configPath}`));
    console.log(pico.white(`  - extensions: ${extensions.join(",")}`));
    console.log(pico.white(`  - targetDir: ${targetDir}`));
    console.log(pico.white(`  - isFlatConfig: ${isFlatConfig}`));
    let outputs = "";
    const lint = spawn(
      "npx",
      [
        "-c",
        `'ESLINT_USE_FLAT_CONFIG=${isFlatConfig} eslint ${targetDir} --config ${configPath} --debug'`,
      ],
      { shell: true },
    );

    const grep = spawn("grep", ['"Parsing\\ssuccessful:"'], {
      shell: true,
    });
    lint.stderr.pipe(grep.stdin);
    process.stdout.write("  ");

    grep.stdout.on("data", (data) => {
      process.stdout.write(".");
      outputs = `${outputs}${data.toString()}`;
    });
    grep.stderr.on("data", (data) => {
      reject([]);
    });
    grep.stdout.on("close", () => {
      console.log("Finished listing target files!");
      resolve(
        outputs
          .split("\n")
          .map((line) => line.split("Parsing successful: ")[1])
          .filter((line) => !!line)
          .slice()
          .sort(),
      );
    });
  });
};
