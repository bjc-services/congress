/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { AsyncLocalStorage } from "async_hooks";
import type { PgTransactionConfig } from "drizzle-orm/pg-core";

import { db } from "./client";

export function createContext<T>() {
  const storage = new AsyncLocalStorage<T>();
  return {
    use() {
      const result = storage.getStore();
      if (!result) {
        throw new Error("No context available");
      }
      return result;
    },
    with<R>(value: T, fn: () => R) {
      return storage.run<R>(value, fn);
    },
  };
}

export type DB = typeof db;

export type Transaction = Parameters<Parameters<DB["transaction"]>[0]>[0];

export type TxOrDb = Transaction | DB;

const TransactionContext = createContext<{
  tx: Transaction;
  effects: (() => void | Promise<void>)[];
}>();

export async function useTransaction<T>(callback: (trx: TxOrDb) => Promise<T>) {
  try {
    const { tx } = TransactionContext.use();
    return callback(tx);
  } catch {
    return callback(db);
  }
}

export async function afterTx(effect: () => any | Promise<any>) {
  try {
    const { effects } = TransactionContext.use();
    effects.push(effect);
  } catch {
    await effect();
  }
}

export async function createTransaction<T>(
  callback: (tx: Transaction) => Promise<T>,
  isolationLevel?: PgTransactionConfig["isolationLevel"],
): Promise<T> {
  try {
    const { tx } = TransactionContext.use();
    return callback(tx);
  } catch {
    const effects: (() => void | Promise<void>)[] = [];
    const result = await db.transaction(
      async (tx) => {
        return TransactionContext.with({ tx, effects }, () => callback(tx));
      },
      {
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        isolationLevel: isolationLevel || "read committed",
      },
    );
    // eslint-disable-next-line @typescript-eslint/await-thenable
    await Promise.all(effects.map((x) => x()));
    return result as T;
  }
}
