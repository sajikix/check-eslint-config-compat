import path from "node:path";

export const TEMP_FILE_PATH = "_temp.js";

export const getTempFilePath = (dir: string) => path.join(dir, TEMP_FILE_PATH);

export const DEFAULT_COMPAT_DATA_FILE_PATH = "./.compat.json";
