#!/usr/bin/env bun
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

// Bun supports import.meta.dir directly
const LICENSE_PATH = join(import.meta.dirname, "..", "LICENSE");
const currentYear = new Date().getFullYear();

// Read the LICENSE file
const licenseContent = readFileSync(LICENSE_PATH, "utf-8");

// Replace the year (matches format: Copyright (c) ... YYYY)
const updatedContent = licenseContent.replace(
  /Copyright \(c\) Bukharian Jewish Congress \(קונגרס יהודי בוכרה - ע״ר 580361285\) \d{4}/,
  `Copyright (c) Bukharian Jewish Congress (קונגרס יהודי בוכרה - ע״ר 580361285) ${currentYear}`,
);

// Write back to file
writeFileSync(LICENSE_PATH, updatedContent, "utf-8");

console.log(`✓ Updated LICENSE copyright year to ${currentYear}`);
