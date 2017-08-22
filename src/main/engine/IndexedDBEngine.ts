import CRUDEngine from './CRUDEngine';
import Dexie from 'dexie';
import {RecordNotFoundError} from './error';

export default class IndexedDBEngine implements CRUDEngine {
  public storeName: string;

  constructor(private db: Dexie) {
    this.storeName = db.name;
  }

  public create<T>(tableName: string, primaryKey: string, entity: T): Promise<string> {
    return this.db[tableName].add(entity, primaryKey)
      .catch((error) => {
        if (error.name === 'ConstraintError') {
          return this.delete(tableName, primaryKey).then(() => this.create(tableName, primaryKey, entity));
        } else {
          throw error;
        }
      })
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
    return Promise.resolve().then(() => {
      return this.db[tableName].get(primaryKey);
    }).then((record: T) => {
      if (record) {
        return record;
      }
      const message: string = `Record "${primaryKey}" from store "${tableName}" could not be found.`;
      throw new RecordNotFoundError(message);
    });
  }

  public readAll<T>(tableName: string): Promise<T[]> {
    return this.db[tableName].toArray();
  }

  public readAllPrimaryKeys(tableName: string): Promise<string[]> {
    return this.db[tableName].toCollection().keys();
  }

  public update(tableName: string, primaryKey: string, changes: Object): Promise<string> {
    return this.db[tableName].update(primaryKey, changes)
      .then((updatedRecords: number) => primaryKey);
  }
}
