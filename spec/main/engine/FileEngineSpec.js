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

  afterEach((done) => {
    fs.remove(TEST_DIRECTORY).then(done);
  });

  describe('create', () => {
    it('creates a serialized database record.', (done) => {
      const TABLE_NAME = 'table-name';
      const PRIMARY_KEY = 'primary-key';

      const entity = {
        some: 'value'
      };

      engine.create(TABLE_NAME, PRIMARY_KEY, JSON.stringify(entity))
        .then((primaryKey) => {
          return engine.read(TABLE_NAME, primaryKey);
        })
        .then((record) => {
          const data = JSON.parse(record);
          expect(data.some).toEqual(entity.some);
          done();
        })
        .catch((error) => done.fail(error));
    });
  });
});
