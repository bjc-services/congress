import { ulid } from "ulidx";

import {
  dbIdPrefixes,
  SYSTEM_DOCUMENT_IDS,
  SYSTEM_USER_ID,
} from "@congress/validators/constants";

export const prefixes = dbIdPrefixes;

const _typeCheckUniquePrefixes: ErrorIfDuplicates<typeof prefixes> = prefixes;

function createID(prefix: keyof typeof prefixes): string {
  return [prefixes[prefix], ulid()].join("_");
}

createID.prefixes = prefixes;
createID.SYSTEM_DOCUMENT_IDS = SYSTEM_DOCUMENT_IDS;
createID.SYSTEM_USER_ID = SYSTEM_USER_ID;

type Duplicate<T extends Record<string, string>> = {
  [K in keyof T]: {
    [L in keyof T]: T[K] extends T[L] ? (K extends L ? never : K) : never;
  }[keyof T];
}[keyof T];

type HasDuplicates<T extends Record<string, string>> =
  Duplicate<T> extends never ? false : true;

type ErrorIfDuplicates<T extends Record<string, string>> =
  HasDuplicates<T> extends true
    ? { error: `Duplicate values found: ${Duplicate<T> & string}` }
    : T;

export { createID };
