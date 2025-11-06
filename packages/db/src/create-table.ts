import type { BuildColumns, BuildExtraConfigColumns } from "drizzle-orm";
import type {
  PgColumnBuilderBase,
  PgTableExtraConfig,
  PgTableExtraConfigValue,
  PgTableWithColumns,
} from "drizzle-orm/pg-core";
import { isNull } from "drizzle-orm";
import { index, pgTable } from "drizzle-orm/pg-core";

import { timestamp, timestamps } from "./types";

const timeArchived = timestamp("time_archived");

type EnhancedColumns<TColumnsMap extends Record<string, PgColumnBuilderBase>> =
  TColumnsMap & {
    timeArchived: typeof timeArchived;
  } & typeof timestamps;

// Wrapper function that automatically adds timestamps and timeArchived to all tables
export function createTable<
  TTableName extends string,
  TColumnsMap extends Record<string, PgColumnBuilderBase>,
>(
  name: TTableName,
  columns: TColumnsMap,
): PgTableWithColumns<{
  name: TTableName;
  schema: undefined;
  columns: BuildColumns<TTableName, EnhancedColumns<TColumnsMap>, "pg">;
  dialect: "pg";
}>;

export function createTable<
  TTableName extends string,
  TColumnsMap extends Record<string, PgColumnBuilderBase>,
>(
  name: TTableName,
  columns: TColumnsMap,
  extraConfig: (
    self: BuildExtraConfigColumns<
      TTableName,
      EnhancedColumns<TColumnsMap>,
      "pg"
    >,
  ) => PgTableExtraConfigValue[],
): PgTableWithColumns<{
  name: TTableName;
  schema: undefined;
  columns: BuildColumns<TTableName, EnhancedColumns<TColumnsMap>, "pg">;
  dialect: "pg";
}>;

/**
 * @deprecated The third parameter of createTable is changing and will only accept an array instead of an object
 */
export function createTable<
  TTableName extends string,
  TColumnsMap extends Record<string, PgColumnBuilderBase>,
>(
  name: TTableName,
  columns: TColumnsMap,
  extraConfig: (
    self: BuildExtraConfigColumns<
      TTableName,
      EnhancedColumns<TColumnsMap>,
      "pg"
    >,
  ) => PgTableExtraConfig,
): PgTableWithColumns<{
  name: TTableName;
  schema: undefined;
  columns: BuildColumns<TTableName, EnhancedColumns<TColumnsMap>, "pg">;
  dialect: "pg";
}>;

export function createTable<
  TTableName extends string,
  TColumnsMap extends Record<string, PgColumnBuilderBase>,
>(
  name: TTableName,
  columns: TColumnsMap,
  extraConfigFn?: (
    self: BuildExtraConfigColumns<
      TTableName,
      EnhancedColumns<TColumnsMap>,
      "pg"
    >,
  ) => PgTableExtraConfigValue[] | PgTableExtraConfig,
) {
  const enhancedColumns = {
    ...columns,
    ...timestamps,
    timeArchived,
  } as unknown as EnhancedColumns<TColumnsMap>;

  return pgTable(name, enhancedColumns, (table) => {
    const config: PgTableExtraConfigValue[] = [
      index(`${name}_time_archived_index`)
        .on(table.timeArchived)
        .where(isNull(table.timeArchived)),
    ];
    const extraConfig = extraConfigFn?.(table) ?? [];
    if (Array.isArray(extraConfig)) {
      config.push(...extraConfig);
    } else {
      Object.entries(extraConfig).forEach(([_, value]) => {
        config.push(value);
      });
    }
    return config;
  });
}
