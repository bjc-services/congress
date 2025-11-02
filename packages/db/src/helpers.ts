/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AnyColumn, SQL, Table } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { getTableColumns, ilike, sql } from "drizzle-orm";

interface ColumnSelector<C extends AllColumns<Table>> {
  pick: <K extends keyof C>(...columns: K[]) => ColumnSelector<Pick<C, K>>;
  omit: <K extends keyof C>(...columns: K[]) => ColumnSelector<Omit<C, K>>;
  columns: C;
}
type AllColumns<T extends Table> = T["_"]["columns"];

/**
 * Creates a column selector for a given Drizzle ORM table.
 *
 * This function allows for flexible selection and omission of columns from a table.
 *
 * @param table - The Drizzle ORM table to create a column selector for.
 * @returns A column selector object that can be used to select and omit columns from the table, access the result with `.columns`
 *
 * @example
 * // Assuming we have a 'users' table with columns: id, name, email, age
 * const userSelector = columnSelector(usersTable);
 *
 * // Select specific columns
 * const nameAndEmail = userSelector.select('name', 'email').columns;
 * // Result: { name: Column, email: Column }
 *
 * // Omit specific columns
 * const withoutAge = userSelector.omit('age').columns;
 * // Result: { id: Column, name: Column, email: Column }
 *
 * // Chain operations
 * const onlyName = userSelector.select('name', 'email').omit('email').columns;
 * // Result: { name: Column }
 */

export function columnSelector<T extends Table>(table: T) {
  const createColumnSelector = <C extends AllColumns<T>>(
    currentColumns: C,
  ): ColumnSelector<C> => ({
    pick: <K extends keyof C>(...columns: K[]) =>
      createColumnSelector(
        Object.fromEntries(
          Object.entries(currentColumns).filter(([key]) =>
            columns.includes(key as K),
          ),
        ) as Pick<C, K>,
      ),
    omit: <K extends keyof C>(...columns: K[]) =>
      createColumnSelector(
        Object.fromEntries(
          Object.entries(currentColumns).filter(
            ([key]) => !columns.includes(key as K),
          ),
        ) as Omit<C, K>,
      ),
    columns: currentColumns,
  });

  return createColumnSelector(getTableColumns(table));
}

export function noTimestampsSelector<T extends Table>(table: T) {
  return columnSelector(table).omit(
    "timeCreated",
    "timeDeleted",
    "timeUpdated",
  );
}

/**
 * Coalesce a value to a default value if the value is null
 * Ex default array: themes: coalesce(pubThemeListQuery.themes, sql`'[]'`)
 * Ex default number: votesCount: coalesce(PubPollAnswersQuery.count, sql`0`)
 */
export function coalesce<T>(
  value: SQL.Aliased<T> | SQL<T> | AnyColumn,
  defaultValue: SQL.Aliased<T> | SQL<T> | AnyColumn,
) {
  return sql<T>`coalesce(${value.getSQL()}, ${defaultValue.getSQL()})`;
}

export function trgm(column: AnyColumn, value: string | SQL) {
  return sql`${column} % ${value}`;
}

export function excluded(column: AnyColumn | SQL.Aliased<unknown>) {
  return sql.raw(
    `EXCLUDED.${"fieldAlias" in column ? column.fieldAlias : column.name}`,
  );
}

export const ilikeAny = (column: AnyColumn, values: string[]) => {
  return ilike(
    column,
    sql`
    ANY(
      ARRAY[
      ${sql.join(
        values.map((q) => sql`${`%${q}%`}`),
        sql.raw(","),
      )}
      ]
    )`,
  );
};

/**
 * Merge JSON objects using PostgreSQL's || operator
 * Ex: metadata: mergeJson(table.metadata, { unassignment: { cause: "swap", id: swapId } })
 * Result: existing_json || new_json
 */
export function mergeJson<
  TColumn extends PgColumn<{
    dataType: "json";
    columnType: "PgJsonb";
    notNull: true;
    tableName: any;
    hasDefault: any;
    isPrimaryKey: any;
    isAutoincrement: any;
    hasRuntimeDefault: any;
    enumValues: any;
    baseColumn: any;
    data: any;
    driverParam: any;
    name: any;
  }>,
>(
  column: TColumn,
  newData: Partial<TColumn["_"]["data"]> &
    ({ unassignOperationId: string } | { assignOperationId: string }),
) {
  return sql<
    TColumn["_"]["data"]
  >`${column} || ${JSON.stringify(newData)}::jsonb`;
}
