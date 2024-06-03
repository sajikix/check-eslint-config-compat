import pico from "picocolors";
import { LanguageOptions } from "./types";

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
    this.differentRules[filePath].differentLanguageOptions
      ? this.differentRules[filePath].differentLanguageOptions?.push(
          languageOptionsDiff,
        )
      : (this.differentRules[filePath].differentLanguageOptions = [
          languageOptionsDiff,
        ]);
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
    }
  }

  reportDifferentRules() {
    if (Object.keys(this.differentRules).length > 0) {
      console.error(pico.red("🚨 There are differences in lint rules"));
      Object.values(this.differentRules).forEach((diff) => {
        console.error(`--------------------------------------------`);
        console.error(`path : ${diff.filePath}`);
        diff.increased &&
          console.error(
            pico.red("- following rules are increased."),
            [
              ...diff.increased.slice(0, 10),
              diff.increased.length > 10
                ? `...and ${diff.increased.length - 10} more rules`
                : undefined,
            ].filter(Boolean),
          );

        diff.decreased &&
          console.error(
            pico.red("- following rules are reduced."),
            [
              ...diff.decreased.slice(0, 10),
              diff.decreased.length > 10
                ? `...and ${diff.decreased.length - 10} more rules`
                : undefined,
            ].filter(Boolean),
          );

        if (diff.differentSeverities) {
          console.error(
            pico.red("- following rules have different severities."),
          );
          console.error(
            pico.red(
              diff.differentSeverities
                .map(
                  (_diff) =>
                    `  - ${_diff.key} : ${_diff.oldSeverity} -> ${_diff.newSeverity}`,
                )
                .join("\n"),
            ),
          );
        }
        if (diff.differentRuleOptions) {
          console.error(pico.red("- following rules have different options."));
          console.error(
            pico.red(
              diff.differentRuleOptions
                .map(
                  (_diff) =>
                    `  - ${_diff.key} : ${JSON.stringify(
                      _diff.oldOption,
                    )} -> ${JSON.stringify(_diff.newOption)}`,
                )
                .join("\n"),
            ),
          );
        }
        if (diff.differentLanguageOptions) {
          console.error(
            pico.red("- following language options are different."),
          );
          console.error(
            pico.red(
              diff.differentLanguageOptions
                .map(
                  (_diff) =>
                    `  - ${_diff.type} : ${truncateJson(
                      JSON.stringify(_diff.oldOption),
                    )} -> ${truncateJson(JSON.stringify(_diff.newOption))}`,
                )
                .join("\n"),
            ),
          );
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

const truncateJson = (json: string | undefined) => {
  if (json && json.length > 100) {
    return `${json.slice(0, 100)} ... }`;
  }
  return json;
};
