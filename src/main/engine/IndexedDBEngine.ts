import Dexie from 'dexie';

export default class IndexedDBEngine implements CRUDEngine {
  private db: Dexie;

  constructor(storeName: string) {
    this.db = new Dexie(storeName);
  }

  public create(tableName: string, primaryKey: string, entity: any): Promise<string> {
    return this.db[tableName].add(entity, primaryKey);
  }

  public delete(tableName: string, primaryKey: string): Promise<string> {
    return Promise.resolve()
      .then(() => this.db[tableName].delete(primaryKey))
      .then(() => primaryKey);
  }

  public deleteAll(tableName: string): Promise<boolean> {
    return this.db[tableName].clear().then(() => true);
  }

  public read<T>(tableName: string, primaryKey: string): Promise<T> {
    return this.db[tableName].get(primaryKey);
  }

  public readAll(tableName: string): Promise<any[]> {
    return this.db[tableName].toArray();
  }

  public readAllPrimaryKeys(tableName: string): Promise<any[]> {
    return this.db[tableName].toCollection().keys();
  }

  public update(tableName: string, primaryKey: string, changes: any): Promise<string> {
    return this.db[tableName].update(primaryKey, changes)
      .then((updatedRecords: number) => primaryKey);
  }
}
