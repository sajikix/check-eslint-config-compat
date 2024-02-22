import arrayDiff from "lodash/difference";
import { spawn } from "node:child_process";
import pico from "picocolors";
import { ConfigInfo } from "./types";

type GetTargetFilePathsArgs = {
  configPath: string;
  extensions: string[];
  targetDir: string;
  isFlatConfig: boolean;
};

export const compareTargetFilePaths = async (
  oldConfigMeta: ConfigInfo,
  newConfigMeta: ConfigInfo,
  extensions: string[],
) => {
  const oldTargetFilePaths = await getTargetFilePaths({
    configPath: oldConfigMeta.configPath,
    isFlatConfig: oldConfigMeta.isFlatConfig,
    extensions: extensions,
    targetDir: "./",
  });

  const newTargetFilePaths = await getTargetFilePaths({
    configPath: newConfigMeta.configPath,
    isFlatConfig: newConfigMeta.isFlatConfig,
    extensions: extensions,
    targetDir: "./",
  });

  const decrements = arrayDiff(oldTargetFilePaths, newTargetFilePaths);
  const increments = arrayDiff(newTargetFilePaths, oldTargetFilePaths);

  if (increments.length + decrements.length > 0) {
    console.error(pico.red("🚨 There is a difference in lint targets"));
    increments.length > 0 &&
      console.error(
        pico.red("following files are increased as lint targets..."),
        [
          ...increments.slice(0, 10),
          increments.length > 10 &&
            `...and ${increments.length - 10} more files`,
        ],
      );
    decrements.length > 0 &&
      console.error(
        pico.red("following files are reduced as lint targets..."),
        [
          ...decrements.slice(0, 10),
          decrements.length > 10 &&
            `...and ${decrements.length - 10} more files`,
        ],
      );
    throw new Error();
  }
  console.log(pico.green("✅ No difference in lint targets"));
  return true;
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
        `'ESLINT_USE_FLAT_CONFIG=${isFlatConfig} eslint ${targetDir} --ext ${extensions.join(
          ",",
        )} --config ${configPath} --debug'`,
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
