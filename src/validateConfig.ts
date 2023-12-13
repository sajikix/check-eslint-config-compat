import { exec } from "node:child_process";
import pico from "picocolors";

export const validateConfig = async (
  configPath: string,
  isFlatConfig: boolean
): Promise<void> => {
  return new Promise(function (resolve, reject) {
    console.log(`target : ${configPath}`);
    exec(
      `ESLINT_USE_FLAT_CONFIG=${isFlatConfig} npx eslint ${configPath} --config ${configPath}`,
      (err, stdout, stderr) => {
        if (err) {
          console.error(pico.red(`🚨 node exec error : ${err}`));
          reject();
          process.exit(1);
        }
        if (stderr !== "") {
          const errorMessages = stderr
            ?.split("\n")
            .filter((line) => line !== "") as string[];
          console.error(
            pico.red(
              "🚨 ESLint config is invalid. Detailed errors are as follows."
            )
          );
          errorMessages.forEach((message) => {
            console.error(pico.red(`  ${message}`));
          });
          reject();
          process.exit(1);
        }
        console.log(pico.green("✅ This config is valid."));
        resolve();
      }
    );
  });
};
