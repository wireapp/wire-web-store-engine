import CRUDEngine from './CRUDEngine';

export default class MemoryEngine implements CRUDEngine {
  private stores: { [index: string]: { [index: string]: any } } = {};

  constructor(public storeName: string) {
    this.stores[storeName] = {};
  }

  private prepareTable(tableName: string) {
    if (!this.stores[this.storeName][tableName]) {
      this.stores[this.storeName][tableName] = {};
    }
  }

  public create<T>(tableName: string, primaryKey: string, entity: T): Promise<string> {
    this.prepareTable(tableName);
    return Promise.resolve().then(() => {
      this.stores[this.storeName][tableName][primaryKey] = entity;
      return primaryKey;
    });
  }

  public delete(tableName: string, primaryKey: string): Promise<string> {
    this.prepareTable(tableName);
    return Promise.resolve().then(() => {
      delete this.stores[this.storeName][tableName][primaryKey];
      return primaryKey;
    });
  }

  public deleteAll(tableName: string): Promise<boolean> {
    return Promise.resolve().then(() => {
      delete this.stores[this.storeName][tableName];
      return true;
    });
  }

  public read<T>(tableName: string, primaryKey: string): Promise<T> {
    this.prepareTable(tableName);
    return Promise.resolve().then(() => {
      return this.stores[this.storeName][tableName][primaryKey];
    });
  }

  public readAll<T>(tableName: string): Promise<T[]> {
    this.prepareTable(tableName);
    const promises: Array<Promise<T>> = [];

    for (let primaryKey of Object.keys(this.stores[this.storeName][tableName])) {
      promises.push(this.read(tableName, primaryKey));
    }

    return Promise.all(promises);
  }

  public readAllPrimaryKeys(tableName: string): Promise<string[]> {
    this.prepareTable(tableName);
    return Promise.resolve(Object.keys(this.stores[this.storeName][tableName]));
  }

  public update(tableName: string, primaryKey: string, changes: Object): Promise<string> {
    this.prepareTable(tableName);
    return this.read(tableName, primaryKey).then((entity: Object) => {
      return Object.assign(entity, changes);
    }).then((updatedEntity: Object) => {
      return this.create(tableName, primaryKey, updatedEntity);
    });
  }
}
