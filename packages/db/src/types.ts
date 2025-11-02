import { customType, timestamp as rawTs } from "drizzle-orm/pg-core";

import { prefixes } from "./id";

const ULID_LENGTH = 26;

export const ulid = (prefix: keyof typeof prefixes) =>
  customChar({ length: ULID_LENGTH + 1 + prefixes[prefix].length });

export const customChar = customType<{
  data: string;
  configRequired: true;
  driverData: string;
  config: { length: number };
}>({
  dataType(config) {
    return `char(${config.length})`;
  },
  fromDriver(value) {
    return value.trim();
  },
});

export const timestamp = (name: string) =>
  rawTs(name, {
    precision: 3,
    mode: "date",
  });

/**
 * Store money as an integer in cents
 */
export const dollar = (name: string) =>
  customType<{
    data: number;
    configRequired: false;
    driverData: number;
  }>({
    dataType() {
      return "bigint";
    },
    fromDriver(value) {
      return Number(value);
    },
    toDriver(value) {
      return Math.round(value);
    },
  })(name);

export const timestamps = {
  timeCreated: timestamp("time_created").notNull().defaultNow(),
  timeUpdated: timestamp("time_updated")
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
  timeDeleted: timestamp("time_deleted"),
};

export const varcharWithCheck = <ValidValues extends string[]>(
  dbName: string,
  config: { length: number; validValues: ValidValues },
) => {
  return customType<{
    data: ValidValues[number];
    configRequired: true;
    driverData: ValidValues[number];
    config: { length: number; validValues: ValidValues };
  }>({
    dataType(config) {
      return `VARCHAR(${config.length}) CHECK (${dbName} IN (${config.validValues.map((v) => `'${v}'`).join(", ")}))`;
    },
    fromDriver(value) {
      if (!config.validValues.includes(value)) {
        throw new Error(
          `Value ${value} is not in the list of valid values: ${config.validValues.join(", ")}`,
        );
      }
      return value;
    },
    toDriver(value) {
      if (!config.validValues.includes(value)) {
        throw new Error(
          `Value ${value} is not in the list of valid values: ${config.validValues.join(", ")}`,
        );
      }
      return value;
    },
  })(dbName, config);
};

export function maxEnumLength(
  enumValues: string[] | readonly string[],
): number {
  let max = 0;
  for (const value of enumValues) {
    if (value.length > max) {
      max = value.length;
    }
  }
  return max;
}
