export type CompatInfo = {
  targets: string[];
  filesConfig: FilesConfig[];
  supportExtensions: string[];
};

export type FilesConfig = {
  key: string;
  targetFilePaths: string[];
  rules: Rules;
  languageOptions: LanguageOptions;
  settings?: Record<string, unknown>;
  env?: Record<string, boolean>;
};

export type Rules = {
  [rule: string]: [
    0 | 1 | 2 | "off" | "warn" | "error",
    ...Array<Record<string, unknown>>,
  ];
};

export type LanguageOptions = {
  ecmaVersion?: number | "latest";
  sourceType?: "script" | "module" | "commonjs";
  globals?: Record<string, boolean | "readable" | "readonly" | "writable">;
  parserOptions?: Record<string, unknown>;
};
