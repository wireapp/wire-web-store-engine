const fs = require('fs-extra');
const path = require('path');
const {StoreEngine} = require('../../../dist/commonjs');

describe('StoreEngine.FileEngine', () => {
  const DATABASE_NAME = 'database-name';
  const TABLE_NAME = 'the-simpsons';

  const TEST_DIRECTORY = path.join(process.cwd(), '.tmp', DATABASE_NAME);
  let engine = undefined;

  beforeEach(() => engine = new StoreEngine.FileEngine(TEST_DIRECTORY));

  afterEach((done) => fs.remove(TEST_DIRECTORY).then(done).catch(done.fail));

  describe('"resolvePath"', () => {

    it('properly validate paths', (done) => {
      const PRIMARY_KEY = 'primary-key';
      const entity = {
        some: 'value'
      };

      Promise.all([
        engine.resolvePath('../etc', PRIMARY_KEY).catch((error) => error),
        engine.resolvePath('..\\etc', PRIMARY_KEY).catch((error) => error),
        engine.resolvePath('.etc', PRIMARY_KEY).catch((error) => error),
        engine.resolvePath(TABLE_NAME, '../etc').catch((error) => error),
        engine.resolvePath(TABLE_NAME, '..\\etc').catch((error) => error),
        engine.resolvePath(TABLE_NAME, '.etc').catch((error) => error),
      ])
      .then((results) => {
        expect(results.length).toBe(6);
        for (error of results) {
          expect(error.name === 'PathValidationError').toBe(true);
          expect(error.message).toBe(StoreEngine.error.PathValidationError.TYPE.PATH_TRAVERSAL);
        }
        done();
      });
    });
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

    it('does not allow path traversal', (done) => {
      const PRIMARY_KEY = 'primary-key';

      const entity = {
        some: 'value'
      };

      Promise.all([
        engine.create('../etc', PRIMARY_KEY, entity).catch((error) => error),
        engine.create('..\\etc', PRIMARY_KEY, entity).catch((error) => error),
        engine.create('.etc', PRIMARY_KEY, entity).catch((error) => error),
        engine.create(TABLE_NAME, '../etc', entity).catch((error) => error),
        engine.create(TABLE_NAME, '..\\etc', entity).catch((error) => error),
        engine.create(TABLE_NAME, '.etc', entity).catch((error) => error),
      ])
      .then((results) => {
        expect(results.length).toBe(6);
        for (error of results) {
          expect(error.name === 'PathValidationError').toBe(true);
          expect(error.message).toBe(StoreEngine.error.PathValidationError.TYPE.PATH_TRAVERSAL);
        }
        done();
      });
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

    it('does not allow path traversal', (done) => {
      const PRIMARY_KEY = 'primary-key';

      Promise.all([
        engine.delete('../etc', PRIMARY_KEY).catch((error) => error),
        engine.delete('..\\etc', PRIMARY_KEY).catch((error) => error),
        engine.delete('.etc', PRIMARY_KEY).catch((error) => error),
        engine.delete(TABLE_NAME, '../etc').catch((error) => error),
        engine.delete(TABLE_NAME, '..\\etc').catch((error) => error),
        engine.delete(TABLE_NAME, '.etc').catch((error) => error),
      ])
      .then((results) => {
        expect(results.length).toBe(6);
        for (error of results) {
          expect(error.name === 'PathValidationError').toBe(true);
          expect(error.message).toBe(StoreEngine.error.PathValidationError.TYPE.PATH_TRAVERSAL);
        }
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

    it('does not allow path traversal', (done) => {
      Promise.all([
        engine.deleteAll('../etc').catch((error) => error),
        engine.deleteAll('..\\etc').catch((error) => error),
        engine.deleteAll('.etc').catch((error) => error),
      ])
      .then((results) => {
        expect(results.length).toBe(3);
        for (error of results) {
          expect(error.name === 'PathValidationError').toBe(true);
          expect(error.message).toBe(StoreEngine.error.PathValidationError.TYPE.PATH_TRAVERSAL);
        }
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
        .then((primaryKey) => engine.read(TABLE_NAME, primaryKey)
        .then((record) => {
          expect(record.some).toBe(entity.some);
          done();
        })
        .catch((error) => done.fail(error)));
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

    it('does not allow path traversal', (done) => {
      const PRIMARY_KEY = 'primary-key';

      Promise.all([
        engine.read('../etc', PRIMARY_KEY).catch((error) => error),
        engine.read('..\\etc', PRIMARY_KEY).catch((error) => error),
        engine.read('.etc', PRIMARY_KEY).catch((error) => error),
        engine.read(TABLE_NAME, '../etc').catch((error) => error),
        engine.read(TABLE_NAME, '..\\etc').catch((error) => error),
        engine.read(TABLE_NAME, '.etc').catch((error) => error),
      ])
      .then((results) => {
        expect(results.length).toBe(6);
        for (error of results) {
          expect(error.name === 'PathValidationError').toBe(true);
          expect(error.message).toBe(StoreEngine.error.PathValidationError.TYPE.PATH_TRAVERSAL);
        }
        done();
      });
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

    it('does not allow path traversal', (done) => {
      Promise.all([
        engine.readAll('../etc').catch((error) => error),
        engine.readAll('..\\etc').catch((error) => error),
        engine.readAll('.etc').catch((error) => error),
      ])
      .then((results) => {
        expect(results.length).toBe(3);
        for (error of results) {
          expect(error.name === 'PathValidationError').toBe(true);
          expect(error.message).toBe(StoreEngine.error.PathValidationError.TYPE.PATH_TRAVERSAL);
        }
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

    it('does not allow path traversal', (done) => {
      Promise.all([
        engine.readAllPrimaryKeys('../etc').catch((error) => error),
        engine.readAllPrimaryKeys('..\\etc').catch((error) => error),
        engine.readAllPrimaryKeys('.etc').catch((error) => error),
      ])
      .then((results) => {
        expect(results.length).toBe(3);
        for (error of results) {
          expect(error.name === 'PathValidationError').toBe(true);
          expect(error.message).toBe(StoreEngine.error.PathValidationError.TYPE.PATH_TRAVERSAL);
        }
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

    it('does not allow path traversal', (done) => {
      const PRIMARY_KEY = 'primary-key';

      const updates = {
        some: 'value'
      };

      Promise.all([
        engine.update('../etc', PRIMARY_KEY, updates).catch((error) => error),
        engine.update('..\\etc', PRIMARY_KEY, updates).catch((error) => error),
        engine.update('.etc', PRIMARY_KEY, updates).catch((error) => error),
        engine.update(TABLE_NAME, '../etc', updates).catch((error) => error),
        engine.update(TABLE_NAME, '..\\etc', updates).catch((error) => error),
        engine.update(TABLE_NAME, '.etc', updates).catch((error) => error),
      ])
      .then((results) => {
        expect(results.length).toBe(6);
        for (error of results) {
          expect(error.name === 'PathValidationError').toBe(true);
          expect(error.message).toBe(StoreEngine.error.PathValidationError.TYPE.PATH_TRAVERSAL);
        }
        done();
      });
    });
  });
});
