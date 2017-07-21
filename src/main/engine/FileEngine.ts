import * as fs from 'fs-extra';
import CRUDEngine from './CRUDEngine';
import path = require('path');
import {RecordNotFoundError} from './error';

export default class FileEngine implements CRUDEngine {
  storeName: string;

  constructor(storeName: string) {
    this.storeName = path.normalize(storeName);
  }

  create<T>(tableName: string, primaryKey: string, entity: T): Promise<string> {
    const file: string = path.normalize(`${this.storeName}/${tableName}/${primaryKey}.txt`);
    return fs.outputFile(file, entity).then(() => primaryKey);
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
    const file: string = path.normalize(`${this.storeName}/${tableName}/${primaryKey}.txt`);

    return new Promise((resolve, reject) => {
      fs.readFile(file, {encoding: 'utf8', flag: 'r'}, function (error, data: any) {
        if (error) {
          if (error.code === 'ENOENT') {
            reject(new RecordNotFoundError(`Record "${primaryKey}" from file "${file}" could not be found.`));
          } else {
            reject(error);
          }
        } else {
          resolve(data);
        }
      });
    });
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
