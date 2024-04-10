/** @type {import('eslint/lib/shared/types').ConfigData} */
module.exports = {
  extends: ["@cybozu/eslint-config/presets/node-typescript-prettier"],
  root: true,
  env: {
    node: true,
  },
  rules: {
    "no-process-exit": "off",
    "node/no-missing-import": "off", // checked by TypeScript
    "node/no-extraneous-import": "off", // checked by TypeScript
  },
  overrides: [
    {
      files: ["./**/*.jsx"],
      rules: {
        "react/jsx-uses-react": "error",
        "react/jsx-uses-vars": "error",
      },
    },
  ],
};
