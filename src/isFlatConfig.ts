import { cosmiconfig } from "cosmiconfig";
import pico from "picocolors";

export const isFlatConfig = async (configPath: string) => {
  const configSearchResult = await cosmiconfig("eslint", {
    searchPlaces: [configPath],
  }).search();

  const config = configSearchResult?.config;

  if (!config) {
    console.error(pico.red(`🚨 config file id not found at ${configPath}`));
    throw new Error();
  }

  return Array.isArray(config);
};
