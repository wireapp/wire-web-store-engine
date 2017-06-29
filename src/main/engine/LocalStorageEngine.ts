export default class LocalStorageEngine implements CRUDStore {
  private storeName: string;

  constructor(storeName: string) {
    this.storeName = storeName;
  }

  create(primaryKey: string, entity: any): Promise<string> {
    return Promise.resolve().then(() => {
      const key = `${this.storeName}@${primaryKey}`;
      window.localStorage.setItem(key, JSON.stringify(entity));
      return key;
    });
  }

  delete(primaryKey: string): Promise<string> {
    return Promise.resolve().then(() => {
      const key: string = `${this.storeName}@${primaryKey}`;
      window.localStorage.removeItem(key);
      return key;
    });
  }

  deleteAll(): Promise<boolean> {
    return Promise.resolve().then(() => {
      Object.keys(localStorage).forEach((key: string) => localStorage.removeItem(key));
      return true;
    });
  }

  read(primaryKey: string): Promise<any> {
    return Promise.resolve().then(() => {
      const key: string = `${this.storeName}@${primaryKey}`;
      return JSON.parse(window.localStorage.getItem(key));
    });
  }

  readAll(storeName: string): Promise<any[]> {
    const promises: Array<Promise<string>> = [];

    Object.keys(localStorage).forEach((key: string) => {
      if (key.startsWith(this.storeName)) {
        promises.push(this.read(key));
      }
    });

    return Promise.all(promises);
  }

  update(primaryKey: string, changes: any): Promise<string> {
    return this.read(primaryKey).then((entity: any) => {
      return Object.assign(entity, changes);
    }).then((updatedEntity: any) => {
      return this.create(primaryKey, updatedEntity);
    });
  }
}
