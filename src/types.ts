export type ConfigInfo = {
  configPath: string;
  targetSampleFilePath: string;
  overridePatterns: string[];
};

export type CompatInfo = {
  targets: string[];
  ruleSets: RuleSets;
  supportExtensions: string[];
};

export type Rules = {
  [rule: string]: [
    0 | 1 | 2 | "off" | "warn" | "error",
    ...Array<Record<string, unknown>>,
  ];
};

export type RuleSets = {
  [filePath: string]: Rules;
};
