export default class LocalStorageEngine implements CRUDEngine {

  constructor(private storeName: string) {
  }

  public create<T>(tableName: string, primaryKey: string, entity: T): Promise<string> {
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

  public read<T>(tableName: string, primaryKey: string): Promise<T> {
    return Promise.resolve().then(() => {
      const key: string = `${this.storeName}@${tableName}@${primaryKey}`;
      return JSON.parse(window.localStorage.getItem(key)) || undefined;
    });
  }

  public readAll<T>(tableName: string): Promise<T[]> {
    const promises: Array<Promise<T>> = [];

    Object.keys(localStorage).forEach((key: string) => {
      const prefix: string = `${this.storeName}@${tableName}@`;
      if (key.startsWith(prefix)) {
        promises.push(this.read(tableName, key));
      }
    });

    return Promise.all(promises);
  }

  public readAllPrimaryKeys(tableName: string): Promise<string[]> {
    const primaryKeys: Array<string> = [];

    Object.keys(localStorage).forEach((primaryKey: string) => {
      const prefix: string = `${this.storeName}@${tableName}@`;
      if (primaryKey.startsWith(prefix)) {
        primaryKeys.push(primaryKey.replace(prefix, ''));
      }
    });

    return Promise.resolve(primaryKeys);
  }

  public update(tableName: string, primaryKey: string, changes: Object): Promise<string> {
    return this.read(tableName, primaryKey).then((entity: Object) => {
      return Object.assign(entity, changes);
    }).then((updatedEntity: Object) => {
      return this.create(tableName, primaryKey, updatedEntity);
    });
  }
}
