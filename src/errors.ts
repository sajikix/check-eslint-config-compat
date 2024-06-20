import pico from "picocolors";
import { LanguageOptions } from "./types";
import { diff as formatDiff, DiffOptions } from "jest-diff";

const options: DiffOptions = {
  aAnnotation: "Deleted from oldConfig",
  bAnnotation: "Added in newConfig.",
  contextLines: 1,
  expand: false,
  aColor: pico.green,
  bColor: pico.magenta,
};

type LanguageOptionsDiff =
  | {
      type: "ecmaVersion";
      newOption: LanguageOptions["ecmaVersion"];
      oldOption: LanguageOptions["ecmaVersion"];
    }
  | {
      type: "globals";
      newOption: LanguageOptions["globals"];
      oldOption: LanguageOptions["globals"];
    }
  | {
      type: "sourceType";
      newOption: LanguageOptions["sourceType"];
      oldOption: LanguageOptions["sourceType"];
    }
  | {
      type: "parserOptions";
      newOption: LanguageOptions["parserOptions"];
      oldOption: LanguageOptions["parserOptions"];
    };

export class Errors {
  invalidConfig: string[];
  getTargetFilesFailed: string | undefined;
  differentTargetFiles:
    | {
        decreased?: string[];
        increased?: string[];
      }
    | undefined;
  differentRules: {
    [filePath: string]: {
      filePath: string;
      decreased?: string[];
      increased?: string[];
      differentSeverities?: Array<{
        key: string;
        oldSeverity: string | number;
        newSeverity: string | number;
      }>;
      differentRuleOptions?: Array<{
        key: string;
        oldOption: Record<string, unknown>;
        newOption: Record<string, unknown>;
      }>;
      differentLanguageOptions?: LanguageOptionsDiff[];
      differentSettings?: {
        oldSettings: Record<string, unknown> | undefined;
        newSettings: Record<string, unknown> | undefined;
      };
    };
  };

  constructor() {
    this.invalidConfig = [];
    this.getTargetFilesFailed = undefined;
    this.differentTargetFiles = undefined;
    this.differentRules = {};
  }

  setInvalidConfig(messages: string[]) {
    this.invalidConfig = messages;
  }

  setGetTargetFilesFailed(message: string) {
    this.getTargetFilesFailed = message;
  }

  setDifferentTargetFiles(decreased?: string[], increased?: string[]) {
    this.differentTargetFiles = {
      decreased,
      increased,
    };
  }

  setRulesIncreaseDecrease(
    filePath: string,
    decreased: string[] | undefined,
    increased: string[] | undefined,
  ) {
    if (!this.differentRules) {
      this.differentRules = {};
    }
    if (!this.differentRules[filePath]) {
      this.differentRules = {
        ...this.differentRules,
        [filePath]: {
          filePath,
          decreased,
          increased,
        },
      };
    } else {
      this.differentRules[filePath] = {
        ...this.differentRules[filePath],
        decreased,
        increased,
      };
    }
  }

  setRulesDifferentSeverities(
    filePath: string,
    key: string,
    oldSeverity: string | number,
    newSeverity: string | number,
  ) {
    if (!this.differentRules) {
      this.differentRules = {};
    }
    if (!this.differentRules[filePath]) {
      this.differentRules = {
        ...this.differentRules,
        [filePath]: {
          filePath,
        },
      };
    }
    this.differentRules[filePath].differentSeverities
      ? this.differentRules[filePath].differentSeverities?.push({
          key,
          oldSeverity,
          newSeverity,
        })
      : (this.differentRules[filePath].differentSeverities = [
          { key, oldSeverity, newSeverity },
        ]);
  }

  setRulesDifferentOptions(
    filePath: string,
    key: string,
    oldOption: Record<string, unknown>,
    newOption: Record<string, unknown>,
  ) {
    if (!this.differentRules) {
      this.differentRules = {};
    }
    if (!this.differentRules[filePath]) {
      this.differentRules = {
        ...this.differentRules,
        [filePath]: {
          filePath,
        },
      };
    }
    this.differentRules[filePath].differentRuleOptions
      ? this.differentRules[filePath].differentRuleOptions?.push({
          key,
          oldOption,
          newOption,
        })
      : (this.differentRules[filePath].differentRuleOptions = [
          { key, oldOption, newOption },
        ]);
  }

  setDifferentLanguageOptions(
    filePath: string,
    languageOptionsDiff: LanguageOptionsDiff,
  ) {
    if (!this.differentRules) {
      this.differentRules = {};
    }
    if (!this.differentRules[filePath]) {
      this.differentRules = {
        ...this.differentRules,
        [filePath]: {
          filePath,
        },
      };
    }
    this.differentRules[filePath].differentLanguageOptions
      ? this.differentRules[filePath].differentLanguageOptions?.push(
          languageOptionsDiff,
        )
      : (this.differentRules[filePath].differentLanguageOptions = [
          languageOptionsDiff,
        ]);
  }

  setDifferentSettings(
    filePath: string,
    oldSettings?: Record<string, unknown>,
    newSettings?: Record<string, unknown>,
  ) {
    if (!this.differentRules) {
      this.differentRules = {};
    }
    if (!this.differentRules[filePath]) {
      this.differentRules = {
        ...this.differentRules,
        [filePath]: {
          filePath,
        },
      };
    }
    this.differentRules[filePath].differentSettings = {
      oldSettings,
      newSettings,
    };
  }

  reportInvalidConfig() {
    if (errors.invalidConfig.length > 0) {
      errors.invalidConfig.forEach((errorMes) => {
        console.log(pico.red(errorMes));
      });
      process.exit(1);
    }
  }

  reportGetTargetFilesFailed() {
    if (this.getTargetFilesFailed) {
      console.error(pico.red("🚨 Get target files failed"));
      console.error(pico.red(this.getTargetFilesFailed));
      process.exit(1);
    }
  }

  reportDifferentTargetFiles() {
    if (this.differentTargetFiles) {
      console.error(pico.red("🚨 There is a difference in lint targets"));
      this.differentTargetFiles.increased &&
        console.error(
          pico.red("following files are increased as lint targets..."),
          [
            ...this.differentTargetFiles.increased.slice(0, 10),
            this.differentTargetFiles.increased.length > 10
              ? `...and ${
                  this.differentTargetFiles.increased.length - 10
                } more files`
              : undefined,
          ].filter(Boolean),
        );
      this.differentTargetFiles.decreased &&
        console.error(
          pico.red("following files are reduced as lint targets..."),
          [
            ...this.differentTargetFiles.decreased.slice(0, 10),
            this.differentTargetFiles.decreased.length > 10
              ? `...and ${
                  this.differentTargetFiles.decreased.length - 10
                } more files`
              : undefined,
          ].filter(Boolean),
        );
      process.exit(1);
    }
  }

  reportDifferentRules() {
    if (Object.keys(this.differentRules).length > 0) {
      console.error(pico.red("🚨 There are differences in lint rules"));
      Object.values(this.differentRules).forEach((diff) => {
        console.error(`--------------------------------------------`);
        console.error(`path : ${diff.filePath}`);
        console.error("");
        if (diff.increased) {
          console.error(pico.red("following rules are increased."));
          console.error(
            [
              ...diff.increased.slice(0, 10),
              diff.increased.length > 10
                ? `...and ${diff.increased.length - 10} more rules`
                : undefined,
            ].filter(Boolean),
          );
          console.error("");
        }

        if (diff.decreased) {
          console.error(pico.red("following rules are reduced."));
          console.error(
            [
              ...diff.decreased.slice(0, 10),
              diff.decreased.length > 10
                ? `...and ${diff.decreased.length - 10} more rules`
                : undefined,
            ].filter(Boolean),
          );
          console.error("");
        }

        if (diff.differentSeverities) {
          console.error(pico.red("following rules have different severities."));
          console.error(
            diff.differentSeverities
              .map(
                (_diff) =>
                  `- ${_diff.key} : ${_diff.oldSeverity} -> ${_diff.newSeverity}`,
              )
              .join("\n"),
          );
        }
        if (diff.differentRuleOptions) {
          diff.differentRuleOptions.forEach((ruleOptionsDiff) => {
            console.error(
              pico.red(`"${ruleOptionsDiff.key}" rule have different options.`),
            );
            console.error(
              indentMessage(
                formatDiff(
                  ruleOptionsDiff.oldOption,
                  ruleOptionsDiff.newOption,
                  options,
                ),
              ),
            );
            console.error("");
          });
        }
        if (diff.differentLanguageOptions) {
          diff.differentLanguageOptions.forEach((languageOptionsDiff) => {
            console.error(
              pico.red(
                `language option : "${languageOptionsDiff.type}" is different.`,
              ),
            );
            console.error(
              indentMessage(
                formatDiff(
                  languageOptionsDiff.oldOption,
                  languageOptionsDiff.newOption,
                  options,
                ),
              ),
            );
            console.error("");
          });
        }
        if (diff.differentSettings) {
          console.error(pico.red("settings are different."));
          console.error(
            indentMessage(
              formatDiff(
                diff.differentSettings.oldSettings,
                diff.differentSettings.newSettings,
                options,
              ),
            ),
          );
          console.error("");
        }
      });
    }
  }

  hasNoErrors() {
    return (
      this.invalidConfig.length === 0 &&
      !this.getTargetFilesFailed &&
      !this.differentTargetFiles &&
      Object.keys(this.differentRules).length === 0
    );
  }
}

export const errors = new Errors();

const indentMessage = (message: string | null) => {
  !message && (message = "");
  return message
    .split("\n")
    .map((line) => `  ${line.trim()}`)
    .join("\n");
};
