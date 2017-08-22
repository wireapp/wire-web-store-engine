import * as fs from 'fs-extra';
import CRUDEngine from './CRUDEngine';
import path = require('path');
import {PathValidationError, RecordNotFoundError} from './error';

export default class FileEngine implements CRUDEngine {
  constructor(public storeName: string, private options: {fileExtension: string} = {
      fileExtension: '.dat'
    }) {
      this.storeName = path.normalize(storeName);
      this.options = options;
  }

  private resolvePath(tableName: string, primaryKey?: string): Promise<string> {
    const isPathTraversal = (...testPaths: string[]): boolean => {
      for (let testPath of testPaths) {
        if (typeof testPath !== 'undefined' && (testPath.includes('.') || testPath.includes('/') || testPath.includes('\\'))) {
          return true;
        }
      }
      return false;
    };

    return new Promise((resolve, reject) => {
      if (isPathTraversal(tableName, primaryKey)) {
        return reject(new PathValidationError(PathValidationError.TYPE.PATH_TRAVERSAL));
      }

      return resolve(path.join(this.storeName, tableName, (primaryKey ? `${primaryKey}${this.options.fileExtension}` : '')));
    });
  }

  create<T>(tableName: string, primaryKey: string, entity: any): Promise<string> {
    return this.resolvePath(tableName, primaryKey).then(file => {
      // TODO: Implement "base64" serialization to save any kind of data.
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
    return this.resolvePath(tableName, primaryKey).then(file => {
      return fs.remove(file).then(() => primaryKey).catch(() => false);
    })
  }

  deleteAll(tableName: string): Promise<boolean> {
    return this.resolvePath(tableName).then(directory => {
      return fs.remove(directory).then(() => true).catch(() => false);
    });
  }

  read<T>(tableName: string, primaryKey: string): Promise<T> {
    return this.resolvePath(tableName, primaryKey).then(file => {
      return new Promise<T>((resolve, reject) => {
        fs.readFile(file, {encoding: 'utf8', flag: 'r'}, (error: any, data: any) => {
          if (error) {
            if (error.code === 'ENOENT') {
              const message: string = `Record "${primaryKey}" in "${tableName}" could not be found.`;
              reject(new RecordNotFoundError(message));
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
    return this.resolvePath(tableName).then(directory => {
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
    return this.resolvePath(tableName).then(directory => {
      return new Promise<string[]>(resolve => {
        fs.readdir(directory, (error, files) => {
          if (error) {
            if (error.code === 'ENOENT') {
              resolve([]);
            } else {
              throw new Error(error);
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
    return this.resolvePath(tableName, primaryKey).then(file => {
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
