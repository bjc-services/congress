import { defineConfig } from "eslint/config";

import { baseConfig, restrictEnvAccess } from "@congress/eslint-config/base";
import { reactConfig } from "@congress/eslint-config/react";

export default defineConfig(
  {
    ignores: [".nitro/**", ".output/**", ".tanstack/**"],
  },
  baseConfig,
  reactConfig,
  restrictEnvAccess,
);
