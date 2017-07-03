export default class InMemoryEngine implements CRUDEngine {
  private stores: Object = {};

  constructor(private storeName: string) {
    this.stores[storeName] = {};
  }

  private prepareTable(tableName: string) {
    if (!this.stores[this.storeName][tableName]) {
      this.stores[this.storeName][tableName] = {};
    }
  }

  public create(tableName: string, primaryKey: string, entity: any): Promise<string> {
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

  public read(tableName: string, primaryKey: string): Promise<any> {
    this.prepareTable(tableName);
    return Promise.resolve().then(() => {
      return this.stores[this.storeName][tableName][primaryKey];
    });
  }

  public readAll(tableName: string): Promise<any[]> {
    this.prepareTable(tableName);
    const promises: Array<Promise<string>> = [];

    for (let primaryKey of Object.keys(this.stores[this.storeName][tableName])) {
      promises.push(this.read(tableName, primaryKey));
    }

    return Promise.all(promises);
  }

  public readAllPrimaryKeys(tableName: string): Promise<string[]> {
    this.prepareTable(tableName);
    return Promise.resolve(Object.keys(this.stores[this.storeName][tableName]));
  }

  public update(tableName: string, primaryKey: string, changes: any): Promise<string> {
    this.prepareTable(tableName);
    return this.read(tableName, primaryKey).then((entity: any) => {
      return Object.assign(entity, changes);
    }).then((updatedEntity: any) => {
      return this.create(tableName, primaryKey, updatedEntity);
    });
  }
}
