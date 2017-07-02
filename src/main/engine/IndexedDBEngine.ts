import Dexie from 'dexie';

export default class IndexedDBEngine implements CRUDEngine {
  private db: Dexie;

  constructor(storeName: string) {
    this.db = new Dexie(storeName);
  }

  create(tableName: string, primaryKey: string, entity: any): Promise<string> {
    return this.db[tableName].add(entity, primaryKey);
  }

  delete(tableName: string, primaryKey: string): Promise<string> {
    return Promise.resolve()
      .then(() => {
        return this.db[tableName].delete(primaryKey);
      })
      .then(() => {
        return primaryKey;
      });
  }

  deleteAll(tableName: string): Promise<boolean> {
    return this.db[tableName].clear().then(() => {
      return true;
    });
  }

  read(tableName: string, primaryKey: string): Promise<any> {
    return this.db[tableName].get(primaryKey);
  }

  readAll(tableName: string): Promise<any[]> {
    return this.db[tableName].toArray();
  }

  update(tableName: string, primaryKey: string, changes: any): Promise<string> {
    return this.db[tableName].update(primaryKey, changes)
      .then((updatedRecords: number) => {
        return primaryKey;
      });
  }
}
