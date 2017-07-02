export default class LocalStorageEngine implements CRUDEngine {

  constructor(private storeName: string) {
  }

  public create(tableName: string, primaryKey: string, entity: any): Promise<string> {
    return Promise.resolve().then(() => {
      const key: string = `${this.storeName}@${tableName}@${primaryKey}`;
      window.localStorage.setItem(key, JSON.stringify(entity));
      return primaryKey;
    });
  }

  public delete(tableName: string, primaryKey: string): Promise<string> {
    return Promise.resolve().then(() => {
      const key: string = `${this.storeName}@${tableName}@${primaryKey}`;
      window.localStorage.removeItem(key);
      return primaryKey;
    });
  }

  public deleteAll(tableName: string): Promise<boolean> {
    return Promise.resolve().then(() => {
      Object.keys(localStorage).forEach((key: string) => {
        const prefix: string = `${this.storeName}@${tableName}@`;
        if (key.startsWith(prefix)) {
          localStorage.removeItem(key)
        }
      });
      return true;
    });
  }

  public read(tableName: string, primaryKey: string): Promise<any> {
    return Promise.resolve().then(() => {
      const key: string = `${this.storeName}@${tableName}@${primaryKey}`;
      return JSON.parse(window.localStorage.getItem(key));
    });
  }

  public readAll(tableName: string): Promise<any[]> {
    const promises: Array<Promise<string>> = [];

    Object.keys(localStorage).forEach((key: string) => {
      const prefix: string = `${this.storeName}@${tableName}@`;
      if (key.startsWith(prefix)) {
        promises.push(this.read(tableName, key));
      }
    });

    return Promise.all(promises);
  }

  public update(tableName: string, primaryKey: string, changes: any): Promise<string> {
    return this.read(tableName, primaryKey).then((entity: any) => {
      return Object.assign(entity, changes);
    }).then((updatedEntity: any) => {
      return this.create(tableName, primaryKey, updatedEntity);
    });
  }
}
