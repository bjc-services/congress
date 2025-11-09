import { defineConfig } from "eslint/config";

import { baseConfig } from "@congress/eslint-config/base";
import { reactConfig } from "@congress/eslint-config/react";

export default defineConfig(
  {
    ignores: ["dist/**"],
  },
  baseConfig,
  reactConfig,
);
