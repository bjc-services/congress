import { defineConfig } from "i18next-cli";

export default defineConfig({
  locales: ["en", "he"],
  extract: {
    input: [
      "./apps/**/*.{js,jsx,ts,tsx}",
      "./packages/ui/**/*.{js,jsx,ts,tsx}",
      "./packages/api/**/*.{js,jsx,ts,tsx}",
    ],
    output: "locals/{{language}}/{{namespace}}.json",
  },
  types: {
    output: "./types/18next.d.ts",
    resourcesFile: "./types/resources.d.ts",
    input: "./locals/**/*.json",
  },
});
