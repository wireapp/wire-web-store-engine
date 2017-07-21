const fs = require('fs-extra');
const path = require('path');
const {StoreEngine} = require('../../../dist/commonjs');

describe('StoreEngine.FileEngine', () => {
  const TEST_DIRECTORY = path.normalize(`${__dirname}/../../temp`);
  const DATABASE_NAME = TEST_DIRECTORY;
  let engine = undefined;

  beforeEach(() => {
    engine = new StoreEngine.FileEngine(DATABASE_NAME);
  });

  afterEach((done) => fs.remove(TEST_DIRECTORY).then(done).catch(done.fail));

  describe('"create"', () => {
    it('creates a serialized database record.', (done) => {
      const TABLE_NAME = 'table-name';
      const PRIMARY_KEY = 'primary-key';

      const entity = {
        some: 'value'
      };

      engine.create(TABLE_NAME, PRIMARY_KEY, JSON.stringify(entity))
        .then((primaryKey) => engine.read(TABLE_NAME, primaryKey)
          .then((record) => {
            const data = JSON.parse(record);
            expect(data.some).toEqual(entity.some);
            done();
          })
          .catch((error) => done.fail(error)));
    });
  });

  describe('"delete"', () => {
    it('deletes an entity.', (done) => {
      const TABLE_NAME = 'table-name';

      const homer = {
        primaryKey: 'homer-simpson',
        entity: {
          firstName: 'Homer',
          lastNme: 'Simpson'
        }
      };

      const lisa = {
        primaryKey: 'lisa-simpson',
        entity: {
          firstName: 'Lisa',
          lastNme: 'Simpson'
        }
      };

      const marge = {
        primaryKey: 'marge-simpson',
        entity: {
          firstName: 'Marge',
          lastNme: 'Simpson'
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
    it('deletes all entities.', (done) => {
      const TABLE_NAME = 'table-name';

      const homer = {
        primaryKey: 'homer-simpson',
        entity: {
          firstName: 'Homer',
          lastNme: 'Simpson'
        }
      };

      const lisa = {
        primaryKey: 'lisa-simpson',
        entity: {
          firstName: 'Lisa',
          lastNme: 'Simpson'
        }
      };

      const marge = {
        primaryKey: 'marge-simpson',
        entity: {
          firstName: 'Marge',
          lastNme: 'Simpson'
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
        done();
      });
    });
  });

  describe('"readAllPrimaryKeys"', () => {
    it('gets the primary keys of all records in a table.', (done) => {
      const TABLE_NAME = 'table-name';

      const homer = {
        primaryKey: 'homer-simpson',
        entity: {
          firstName: 'Homer',
          lastNme: 'Simpson'
        }
      };

      const lisa = {
        primaryKey: 'lisa-simpson',
        entity: {
          firstName: 'Lisa',
          lastNme: 'Simpson'
        }
      };

      const marge = {
        primaryKey: 'marge-simpson',
        entity: {
          firstName: 'Marge',
          lastNme: 'Simpson'
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
});
