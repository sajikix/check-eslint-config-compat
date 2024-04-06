import arrayDiff from "lodash/difference";
import pico from "picocolors";

export const _compareTargetFilePaths = async (
  oldTargetFilePaths: string[],
  newTargetFilePaths: string[],
) => {
  const decrements = arrayDiff(oldTargetFilePaths, newTargetFilePaths);
  const increments = arrayDiff(newTargetFilePaths, oldTargetFilePaths);

  if (increments.length + decrements.length > 0) {
    console.error(pico.red("🚨 There is a difference in lint targets"));
    increments.length > 0 &&
      console.error(
        pico.red("following files are increased as lint targets..."),
        [
          ...increments.slice(0, 10),
          increments.length > 10 &&
            `...and ${increments.length - 10} more files`,
        ],
      );
    decrements.length > 0 &&
      console.error(
        pico.red("following files are reduced as lint targets..."),
        [
          ...decrements.slice(0, 10),
          decrements.length > 10 &&
            `...and ${decrements.length - 10} more files`,
        ],
      );
    throw new Error();
  }
  console.log(pico.green("✅ No difference in lint targets"));
  return true;
};
