import * as fs from 'fs-extra';
import CRUDEngine from './CRUDEngine';
import path = require('path');

export default class FileEngine implements CRUDEngine {
  storeName: string;

  constructor(storagePath: string) {
    this.storeName = path.normalize(storagePath);
  }

  create<T>(tableName: string, primaryKey: string, entity: T): Promise<string> {
    const file: string = path.normalize(`${this.storeName}/${tableName}/${primaryKey}.txt`);
    return fs.outputFile(file, entity)
      .then(() => {
        return file;
      });
  }

  delete(tableName: string, primaryKey: string): Promise<string> {
    return fs.remove(tableName)
      .then(() => {
        return true;
      });
  }

  deleteAll(tableName: string): Promise<boolean> {
    return undefined;
  }

  read<T>(tableName: string, primaryKey: string): Promise<T> {
    return undefined;
  }

  readAll<T>(tableName: string): Promise<T[]> {
    return undefined;
  }

  readAllPrimaryKeys(tableName: string): Promise<string[]> {
    return undefined;
  }

  update(tableName: string, primaryKey: string, changes: Object): Promise<string> {
    return undefined;
  }

}
