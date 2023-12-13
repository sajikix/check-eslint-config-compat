import { exec } from "node:child_process";
import pico from "picocolors";
import { TEMP_FILE_PATH } from "./constants";

export const validateConfig = async (
  configPath: string,
  isFlatConfig: boolean
): Promise<void> => {
  return new Promise(function (resolve, reject) {
    console.log(`target : ${configPath}`);
    exec(
      `ESLINT_USE_FLAT_CONFIG=${isFlatConfig} npx eslint ${TEMP_FILE_PATH} --config ${configPath}`,
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
              "🚨 ESLint config is invalid. Detailed errors are as follows."
            )
          );
          errorMessages.forEach((message) => {
            console.error(pico.red(`  ${message}`));
          });
          throw new Error();
        }
        console.log(pico.green("✅ This config is valid."));
        resolve();
      }
    );
  });
};
