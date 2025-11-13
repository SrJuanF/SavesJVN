import next from "eslint-config-next";

export default [
  {
    ignores: ["**/node_modules/**", "**/.next/**"],
  },
  ...next,
  {
    rules: {
      "@next/next/no-sync-scripts": "off",
    },
  },
];
