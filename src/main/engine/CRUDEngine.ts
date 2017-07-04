interface CRUDEngine {
  create<T>(tableName: string, primaryKey: string, entity: T): Promise<string>;
  delete(tableName: string, primaryKey: string): Promise<string>;
  deleteAll(tableName: string): Promise<boolean>;
  read<T>(tableName: string, primaryKey: string): Promise<T>;
  readAll<T>(tableName: string): Promise<T[]>;
  readAllPrimaryKeys(tableName: string): Promise<string[]>;
  update(tableName: string, primaryKey: string, changes: Object): Promise<string>;
}

export default CRUDEngine;
