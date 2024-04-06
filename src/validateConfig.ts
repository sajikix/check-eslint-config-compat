import { exec } from "node:child_process";
import pico from "picocolors";

export const validateConfig = async (
  configPath: string,
  isFlatConfig: boolean,
  targetFilePath: string,
): Promise<void> => {
  return new Promise(function (resolve) {
    console.log(`target : ${configPath}`);
    console.log(
      "command",
      `ESLINT_USE_FLAT_CONFIG=${isFlatConfig} eslint ${targetFilePath} --config ${configPath}`,
    );

    exec(
      `ESLINT_USE_FLAT_CONFIG=${isFlatConfig} eslint ${targetFilePath} --config ${configPath}`,
      (err, stdout, stderr) => {
        if (err) {
          console.error(pico.red(`🚨 node exec error : ${err}`));
          throw new Error();
        }
        if (stderr !== "") {
          const errorMessages = stderr
            ?.split("\n")
            .filter((line) => line !== "") as string[];
          console.error(
            pico.red(
              "🚨 ESLint config is invalid. Detailed errors are as follows.",
            ),
          );
          errorMessages.forEach((message) => {
            console.error(pico.red(`  ${message}`));
          });
          throw new Error();
        }
        console.log(pico.green("✅ This config is valid."));
        resolve();
      },
    );
  });
};
