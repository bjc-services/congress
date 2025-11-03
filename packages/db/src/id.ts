import { ulid } from "ulidx";

export const prefixes = {
  user: "user",
  session: "ses",
  account: "acc",
  verification: "ver",
  person: "person",
  personContact: "p_ctct",
  personAddress: "p_addr",
  personRelationship: "p_rel",
  beneficiaryAccount: "ben_acc",
  beneficiarySession: "ben_ses",
  beneficiaryDocument: "ben_dcm",
  upload: "upl",
  uploadType: "upl_type",
  uploadLink: "upl_link",
} as const;

const _typeCheckUniquePrefixes: ErrorIfDuplicates<typeof prefixes> = prefixes;

export function createID(prefix: keyof typeof prefixes): string {
  return [prefixes[prefix], ulid()].join("_");
}

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
