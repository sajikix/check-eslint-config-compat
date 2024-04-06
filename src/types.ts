export type ConfigInfo = {
  configPath: string;
  isFlatConfig: boolean;
  targetSampleFilePath: string;
  overridePatterns: string[];
};

export type CompatInfo = {
  targets: string[];
  ruleSets: RuleSet[];
  supportExtensions: string[];
};

export type Rules = {
  [rule: string]: [
    0 | 1 | 2 | "off" | "warn" | "error",
    ...Array<Record<string, unknown>>,
  ];
};

export type RuleSet = {
  path: string;
  rules: Rules;
};
