import pico from "picocolors";

export class Errors {
  invalidConfig: string[] | undefined;
  getTargetFilesFailed: string | undefined;
  differentTargetFiles:
    | {
        decreased?: string[];
        increased?: string[];
      }
    | undefined;
  differentRules:
    | {
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
        };
      }
    | undefined;

  constructor() {
    this.invalidConfig = undefined;
    this.getTargetFilesFailed = undefined;
    this.differentTargetFiles = undefined;
    this.differentRules = undefined;
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
    decreased: string[],
    increased: string[],
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
      ? this.differentRules[filePath].differentSeverities.push({
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
      ? this.differentRules[filePath].differentRuleOptions.push({
          key,
          oldOption,
          newOption,
        })
      : (this.differentRules[filePath].differentRuleOptions = [
          { key, oldOption, newOption },
        ]);
  }

  reportInvalidConfig() {
    errors.invalidConfig.forEach((errorMes) => {
      console.log(pico.red(errorMes));
    });
    process.exit(1);
  }

  reportGetTargetFilesFailed() {
    console.error(pico.red("🚨 Get target files failed"));
    console.error(pico.red(this.getTargetFilesFailed));
    process.exit(1);
  }

  reportDifferentTargetFiles() {
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

  reportDifferentRules() {
    console.error(pico.red("🚨 There are differences in lint rules"));
    Object.values(this.differentRules).forEach((diff) => {
      console.error(pico.red(`  - ${diff.filePath}`));
      diff.increased &&
        console.error(
          pico.red("  - following rules are increased."),
          [
            ...diff.increased.slice(0, 10),
            diff.increased.length > 10
              ? `...and ${diff.increased.length - 10} more rules`
              : undefined,
          ].filter(Boolean),
        );

      diff.decreased &&
        console.error(
          pico.red("  - following rules are reduced."),
          [
            ...diff.decreased.slice(0, 10),
            diff.decreased.length > 10
              ? `...and ${diff.decreased.length - 10} more rules`
              : undefined,
          ].filter(Boolean),
        );
      diff.differentSeverities &&
        console.error(
          pico.red("  - following rules have different severities."),
          diff.differentSeverities.map(
            (_diff) =>
              `    - ${_diff.key} : ${_diff.oldSeverity} -> ${_diff.newSeverity}`,
          ),
        );
      diff.differentRuleOptions &&
        console.error(
          pico.red("  - following rules have different options."),
          diff.differentRuleOptions.map(
            (_diff) =>
              `    - ${_diff.key} : ${_diff.oldOption} -> ${_diff.newOption}`,
          ),
        );
    });
  }
}

export const errors = new Errors();
