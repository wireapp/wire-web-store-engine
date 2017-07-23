import * as fs from 'fs-extra';
import CRUDEngine from './CRUDEngine';
import path = require('path');

export default class FileEngine implements CRUDEngine {
  private storeName: string;
  private FILE_EXTENSION: string = '.dat';

  constructor(storeName: string) {
    this.storeName = path.normalize(storeName);
  }

  private securityChecks(datas: Array<string>): Promise<boolean> {
    const isPathTraversal = (pathName: string): boolean => {
      return (pathName.includes('.') || pathName.includes('/') || pathName.includes('\\'));
    };

    return new Promise((resolve, reject) => {
      for (let data of datas) {
        if (isPathTraversal(data)) {
          throw new Error('Path traversal has been detected. Aborting.');
        }
      }
      return resolve(true);
    });
  }

  create<T>(tableName: string, primaryKey: string, entity: any): Promise<string> {
    return this.securityChecks([tableName, primaryKey]).then(() => {
      // TODO: Implement "base64" serialization to save any kind of data.
      const file: string = path.join(this.storeName, tableName, primaryKey, this.FILE_EXTENSION);

      if (typeof entity === 'object') {
        try {
          entity = JSON.stringify(entity);
        } catch (error) {
          entity = entity.toString();
        }
      }
      return fs.outputFile(file, entity).then(() => primaryKey);
    });
  }

  delete(tableName: string, primaryKey: string): Promise<string> {
    return this.securityChecks([tableName, primaryKey]).then(() => {
      const file: string = path.join(this.storeName, tableName, primaryKey, this.FILE_EXTENSION);
      return fs.remove(file).then(() => primaryKey).catch(() => false);
    })
  }

  deleteAll(tableName: string): Promise<boolean> {
    return this.securityChecks([tableName]).then(() => {
      const directory: string = path.join(this.storeName, tableName);
      return fs.remove(directory).then(() => true).catch(() => false);
    });
  }

  read<T>(tableName: string, primaryKey: string): Promise<T> {
    return this.securityChecks([tableName, primaryKey]).then(() => {
      const file: string = path.join(this.storeName, tableName, primaryKey, this.FILE_EXTENSION);

      return new Promise<T>((resolve, reject) => {
        fs.readFile(file, {encoding: 'utf8', flag: 'r'}, (error: any, data: any) => {
          if (error) {
            if (error.code === 'ENOENT') {
              resolve(undefined);
            } else {
              reject(error);
            }
          } else {
            try {
              data = JSON.parse(data);
            } catch (error) {}
            resolve(data);
          }
        });
      });
    });
  }

  readAll<T>(tableName: string): Promise<T[]> {
    return this.securityChecks([tableName]).then(() => {
      const directory: string = path.join(this.storeName, tableName);

      return new Promise<T[]>((resolve, reject) => {
        fs.readdir(directory, (error, files) => {
          if (error) {
            reject(error);
          } else {
            const recordNames = files.map((file) => path.basename(file, path.extname(file)));
            const promises = recordNames.map((primaryKey) => this.read(tableName, primaryKey));
            Promise.all(promises).then((records: T[]) => resolve(records));
          }
        });
      });
    });
  }

  readAllPrimaryKeys(tableName: string): Promise<string[]> {
    return this.securityChecks([tableName]).then(() => {
      const directory: string = path.join(this.storeName, tableName);

      return new Promise((resolve, reject) => {
        fs.readdir(directory, (error, files) => {
          if (error) {
            if (error.code === 'ENOENT') {
              resolve([]);
            } else {
              reject(error);
            }
          } else {
            const fileNames: string[] = files.map((file: string) => path.parse(file).name);
            resolve(fileNames);
          }
        });
      });
    });
  }

  // TODO: Make this function also work for binary data.
  update(tableName: string, primaryKey: string, changes: Object): Promise<string> {
    return this.securityChecks([tableName, primaryKey]).then(() => {
      return this.read(tableName, primaryKey)
        .then((record: any) => {
          if (typeof record === 'string') {
            record = JSON.parse(record);
          }
          const updatedRecord: Object = {...record, ...changes};
          return JSON.stringify(updatedRecord);
        })
        .then((updatedRecord: any) => this.create(tableName, primaryKey, updatedRecord));
    });
  }
}
