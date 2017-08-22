/*
 * Wire
 * Copyright (C) 2017 Wire Swiss GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see http://www.gnu.org/licenses/.
 *
 */

import Dexie from 'dexie';
import {StoreEngine} from '../../../../dist/commonjs/index';

describe('StoreEngine.IndexedDBEngine', () => {
  const DATABASE_NAME = 'database-name';
  const TABLE_NAME = 'the-simpsons';

  let engine = undefined;

  beforeEach(() => {
    const db = new Dexie(DATABASE_NAME);
    db.version(1).stores({
      'the-simpsons': ',firstName,lastName'
    });
    engine = new StoreEngine.IndexedDBEngine(db);
  });

  afterEach(() => {
    if (engine && engine.db) {
      engine.db.close();
    }

    window.indexedDB.deleteDatabase(DATABASE_NAME);
  });

  describe('"create"', () => {
    it('creates a serialized database record.', (done) => {
      const PRIMARY_KEY = 'primary-key';

      const entity = {
        some: 'value'
      };

      engine.create(TABLE_NAME, PRIMARY_KEY, entity)
        .then((primaryKey) => {
          expect(primaryKey).toEqual(PRIMARY_KEY);
          done();
        })
        .catch(done.fail);
    });

    it('overwrites an existing database record.', (done) => {
      const PRIMARY_KEY = 'primary-key';

      const firstEntity = {
        some: 'value'
      };

      const secondEntity = {
        some: 'newer-value'
      };

      engine.create(TABLE_NAME, PRIMARY_KEY, firstEntity)
        .then(() => engine.create(TABLE_NAME, PRIMARY_KEY, secondEntity))
        .then((primaryKey) => engine.read(TABLE_NAME, primaryKey))
        .then((record) => {
          expect(record.some).toBe(secondEntity.some);
          done();
        });
    });

    describe('"delete"', () => {
      it('returns the primary key of a deleted record.', (done) => {
        const PRIMARY_KEY = 'primary-key';

        const entity = {
          some: 'value'
        };

        engine.create(TABLE_NAME, PRIMARY_KEY, entity)
          .then((primaryKey) => engine.delete(TABLE_NAME, primaryKey))
          .then((primaryKey) => {
            expect(primaryKey).toBe(PRIMARY_KEY);
            done();
          });
      });

      it('deletes a record.', (done) => {
        const homer = {
          primaryKey: 'homer-simpson',
          entity: {
            firstName: 'Homer',
            lastName: 'Simpson'
          }
        };

        const lisa = {
          primaryKey: 'lisa-simpson',
          entity: {
            firstName: 'Lisa',
            lastName: 'Simpson'
          }
        };

        const marge = {
          primaryKey: 'marge-simpson',
          entity: {
            firstName: 'Marge',
            lastName: 'Simpson'
          }
        };

        Promise.all([
          engine.create(TABLE_NAME, homer.primaryKey, homer.entity),
          engine.create(TABLE_NAME, lisa.primaryKey, lisa.entity),
          engine.create(TABLE_NAME, marge.primaryKey, marge.entity),
        ])
          .then(() => engine.delete(TABLE_NAME, lisa.primaryKey))
          .then(() => engine.readAllPrimaryKeys(TABLE_NAME))
          .then((primaryKeys) => {
            expect(primaryKeys.length).toBe(2);
            expect(primaryKeys[0]).toBe(homer.primaryKey);
            expect(primaryKeys[1]).toBe(marge.primaryKey);
            done();
          });
      });
    });

    describe('"deleteAll"', () => {
      it('deletes all records from a database table.', (done) => {
        const homer = {
          primaryKey: 'homer-simpson',
          entity: {
            firstName: 'Homer',
            lastName: 'Simpson'
          }
        };

        const lisa = {
          primaryKey: 'lisa-simpson',
          entity: {
            firstName: 'Lisa',
            lastName: 'Simpson'
          }
        };

        const marge = {
          primaryKey: 'marge-simpson',
          entity: {
            firstName: 'Marge',
            lastName: 'Simpson'
          }
        };

        Promise.all([
          engine.create(TABLE_NAME, homer.primaryKey, homer.entity),
          engine.create(TABLE_NAME, lisa.primaryKey, lisa.entity),
          engine.create(TABLE_NAME, marge.primaryKey, marge.entity),
        ])
          .then(() => engine.deleteAll(TABLE_NAME))
          .then((hasBeenDeleted) => {
            expect(hasBeenDeleted).toBe(true);
            return engine.readAllPrimaryKeys(TABLE_NAME);
          })
          .then((primaryKeys) => {
            expect(primaryKeys.length).toBe(0);
            done();
          });
      });
    });

    describe('"read"', () => {
      it('returns a database record.', (done) => {
        const PRIMARY_KEY = 'primary-key';

        const entity = {
          some: 'value'
        };

        engine.create(TABLE_NAME, PRIMARY_KEY, entity)
          .then((primaryKey) => engine.read(TABLE_NAME, primaryKey))
          .then((record) => {
            expect(record.some).toBe(entity.some);
            done();
          });
      });

      it('returns "undefined" if a record cannot be found.', (done) => {
        const PRIMARY_KEY = 'primary-key';

        engine.read(TABLE_NAME, PRIMARY_KEY)
          .then((record) => {
            expect(record).toBeUndefined();
            done();
          })
          .catch((error) => done.fail(error));
      });
    });

    describe('"readAll"', () => {
      it('returns multiple database records.', (done) => {
        const homer = {
          primaryKey: 'homer-simpson',
          entity: {
            firstName: 'Homer',
            lastName: 'Simpson'
          }
        };

        const lisa = {
          primaryKey: 'lisa-simpson',
          entity: {
            firstName: 'Lisa',
            lastName: 'Simpson'
          }
        };

        const marge = {
          primaryKey: 'marge-simpson',
          entity: {
            firstName: 'Marge',
            lastName: 'Simpson'
          }
        };

        Promise.all([
          engine.create(TABLE_NAME, homer.primaryKey, homer.entity),
          engine.create(TABLE_NAME, lisa.primaryKey, lisa.entity),
          engine.create(TABLE_NAME, marge.primaryKey, marge.entity),
        ])
          .then(() => engine.readAll(TABLE_NAME))
          .then((records) => {
            expect(records.length).toBe(3);
            expect(records[0].firstName).toBe(homer.entity.firstName);
            expect(records[1].firstName).toBe(lisa.entity.firstName);
            expect(records[2].firstName).toBe(marge.entity.firstName);
            done();
          });
      });
    });

    describe('"readAllPrimaryKeys"', () => {
      it('gets the primary keys of all records in a table.', (done) => {
        const homer = {
          primaryKey: 'homer-simpson',
          entity: {
            firstName: 'Homer',
            lastName: 'Simpson'
          }
        };

        const lisa = {
          primaryKey: 'lisa-simpson',
          entity: {
            firstName: 'Lisa',
            lastName: 'Simpson'
          }
        };

        const marge = {
          primaryKey: 'marge-simpson',
          entity: {
            firstName: 'Marge',
            lastName: 'Simpson'
          }
        };

        Promise.all([
          engine.create(TABLE_NAME, homer.primaryKey, homer.entity),
          engine.create(TABLE_NAME, lisa.primaryKey, lisa.entity),
          engine.create(TABLE_NAME, marge.primaryKey, marge.entity),
        ])
          .then(() => engine.readAllPrimaryKeys(TABLE_NAME))
          .then((primaryKeys) => {
            expect(primaryKeys.length).toBe(3);
            expect(primaryKeys[0]).toBe(homer.primaryKey);
            expect(primaryKeys[1]).toBe(lisa.primaryKey);
            expect(primaryKeys[2]).toBe(marge.primaryKey);
            done();
          });
      });
    });

    describe('"update"', () => {
      it('updates an existing database record.', (done) => {
        const PRIMARY_KEY = 'primary-key';

        const entity = {
          name: 'Old monitor'
        };

        const updates = {
          age: 177,
          size: {
            height: 1080,
            width: 1920
          }
        };

        engine.create(TABLE_NAME, PRIMARY_KEY, entity)
          .then(() => engine.update(TABLE_NAME, PRIMARY_KEY, updates))
          .then((primaryKey) => engine.read(TABLE_NAME, primaryKey))
          .then((updatedRecord) => {
            expect(updatedRecord.name).toBe(entity.name);
            expect(updatedRecord.age).toBe(updates.age);
            expect(Object.keys(updatedRecord.size).length).toBe(2);
            expect(updatedRecord.size.height).toBe(updates.size.height);
            expect(updatedRecord.size.width).toBe(updates.size.width);
            done();
          })
          .catch(done.fail);
      });
    });
  });
});
