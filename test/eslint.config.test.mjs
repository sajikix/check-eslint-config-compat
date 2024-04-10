// @ts-check
import tseslint from "typescript-eslint";

export default [
  ...tseslint.config(...tseslint.configs.recommended),
  {
    files: ["**/*.js", "**/*.jsx"],
    rules: {
      semi: "error",
      "prefer-const": "error",
    },
  },
  { ignores: ["**/.temp.js", "dist/**", "bin/**", ".prettierrc.js"] },
];
