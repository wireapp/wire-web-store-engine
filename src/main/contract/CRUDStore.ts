interface CRUDStore {
  create(primaryKey: string, entity: any): Promise<string>;
  delete(primaryKey: string): Promise<string>;
  deleteAll(): Promise<boolean>;
  read(primaryKey: string): Promise<any>;
  readAll(storeName: string): Promise<any[]>;
  update(primaryKey: string, changes: any): Promise<string>;
}
