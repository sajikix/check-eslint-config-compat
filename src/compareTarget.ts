import arrayDiff from "lodash/difference";
import pico from "picocolors";
import { errors } from "./errors";

export const compareTargetFilePaths = async (
  oldTargetFilePaths: string[],
  newTargetFilePaths: string[],
) => {
  const decrements = arrayDiff(oldTargetFilePaths, newTargetFilePaths);
  const increments = arrayDiff(newTargetFilePaths, oldTargetFilePaths);

  if (increments.length + decrements.length > 0) {
    errors.setDifferentTargetFiles(
      decrements.length > 0 ? decrements : undefined,
      increments.length > 0 ? increments : undefined,
    );
    return false;
  }
  console.log(pico.green("✅ No difference in lint targets"));
  return true;
};
