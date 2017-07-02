interface CRUDEngine {
  create(tableName: string, primaryKey: string, entity: any): Promise<string>;
  delete(tableName: string, primaryKey: string): Promise<string>;
  deleteAll(tableName: string): Promise<boolean>;
  read(tableName: string, primaryKey: string): Promise<any>;
  readAll(tableName: string): Promise<any[]>;
  update(tableName: string, primaryKey: string, changes: any): Promise<string>;
}
