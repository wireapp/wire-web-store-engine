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

import {LocalStorageEngine} from '../../../dist/commonjs/engine';

describe('engine.LocalStorageEngine', () => {
  const DATABASE_NAME = 'database-name';
  let engine = undefined;

  beforeEach(() => {
    engine = new LocalStorageEngine(DATABASE_NAME);
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  describe('"create"', () => {
    it('creates a serialized database record.', (done) => {
      const TABLE_NAME = 'table-name';
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

    it('overwrites an existing database record.', (done) => {
      const TABLE_NAME = 'table-name';
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
  });

  describe('"delete"', () => {
    it('returns the primary key of a deleted record.', (done) => {
      const TABLE_NAME = 'table-name';
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
  });

  describe('"deleteAll"', () => {
    it('deletes all records from a database table.', (done) => {
      const TABLE_NAME = 'table-name';

      const firstPayload = {
        primaryKey: 'primary-key-1',
        entity: {
          value: 72
        }
      };

      const secondPayload = {
        primaryKey: 'primary-key-2',
        entity: {
          value: 73
        }
      };

      const thirdPayload = {
        primaryKey: 'primary-key-3',
        entity: {
          value: 'ABC'
        }
      };

      Promise.all([
        engine.create(TABLE_NAME, firstPayload.primaryKey, firstPayload.entity),
        engine.create(TABLE_NAME, secondPayload.primaryKey, secondPayload.entity),
        engine.create(TABLE_NAME, thirdPayload.primaryKey, thirdPayload.entity),
      ])
        .then(() => engine.deleteAll(TABLE_NAME))
        .then((hasBeenDeleted) => {
          expect(hasBeenDeleted).toBe(true);
          return engine.readAll(TABLE_NAME);
        })
        .then((records) => {
          expect(records.length).toBe(0);
          done();
        });
    });
  });

  describe('"read"', () => {
    it('returns a database record.', (done) => {
      const TABLE_NAME = 'table-name';
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
  });

  describe('"readAll"', () => {
    it('returns multiple database records.', (done) => {
      const TABLE_NAME = 'table-name';

      const firstPayload = {
        primaryKey: 'primary-key-1',
        entity: {
          value: 72
        }
      };

      const secondPayload = {
        primaryKey: 'primary-key-2',
        entity: {
          value: 73
        }
      };

      const thirdPayload = {
        primaryKey: 'primary-key-3',
        entity: {
          value: 'ABC'
        }
      };

      Promise.all([
        engine.create(TABLE_NAME, firstPayload.primaryKey, firstPayload.entity),
        engine.create(TABLE_NAME, secondPayload.primaryKey, secondPayload.entity),
        engine.create(TABLE_NAME, thirdPayload.primaryKey, thirdPayload.entity),
      ])
        .then(() => engine.readAll(TABLE_NAME))
        .then((records) => {
          expect(records.length).toBe(3);
          done();
        });
    });
  });

  describe('"update"', () => {
    it('updates an existing database record.', (done) => {
      const TABLE_NAME = 'table-name';
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
        });
    });
  });
});
