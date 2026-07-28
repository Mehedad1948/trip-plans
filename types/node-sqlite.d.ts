declare module "node:sqlite" {
  type SqlValue = null | number | bigint | string | Uint8Array;

  interface RunResult {
    lastInsertRowid: number | bigint;
    changes: number;
  }

  interface StatementSync {
    all(...params: SqlValue[]): Record<string, unknown>[];
    get(...params: SqlValue[]): Record<string, unknown> | undefined;
    run(...params: SqlValue[]): RunResult;
  }

  export class DatabaseSync {
    constructor(path: string);
    close(): void;
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
  }
}
