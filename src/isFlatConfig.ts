import { cosmiconfig } from "cosmiconfig";
import pico from "picocolors";

export const isFlatConfig = async (configPath: string) => {
  const configSearchResult = await cosmiconfig("eslint", {
    searchPlaces: [configPath],
  }).search();

  const foundConfigPath = configSearchResult?.filepath;

  if (!foundConfigPath) {
    console.error(pico.red(`🚨 config file id not found at ${configPath}`));
    throw new Error();
  }

  const configModule = await import(foundConfigPath);

  const configObject = await configModule.default;

  return Array.isArray(configObject);
};
