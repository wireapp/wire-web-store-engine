import {Store, StoreEngine} from '../../../dist/commonjs';

describe('store.TransientStore', () => {
  const DATABASE_NAME = 'database-name';
  const TABLE_NAME = 'table-name';

  let engine = undefined;
  let store = undefined;

  beforeEach((done) => {
    engine = new StoreEngine.LocalStorageEngine(DATABASE_NAME);
    store = new Store.TransientStore(engine);
    store.init(TABLE_NAME).then(done);
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  describe('"set"', () => {
    const entity = {access_token: 'iJCRCjc8oROO-dkrkqCXOade997oa8Jhbz6awMUQPBQo80VenWqp_oNvfY6AnU5BxEsdDPOBfBP-uz_b0gAKBQ=='};
    const primaryKey = 'access-tokens';
    const ttl = 900;

    it('saves a record together with it\'s expiration date.', (done) => {
      store.set(primaryKey, entity, ttl)
        .then((bundle) => {
          expect(bundle.expires).toEqual(jasmine.any(Number));
          done();
        })
        .catch((error) => done.fail(error));
    });

    it('saves a record together with it\'s timeoutID.', (done) => {
      store.set(primaryKey, entity, ttl)
        .then((bundle) => {
          expect(bundle.timeoutID).toBeDefined();
          done();
        })
        .catch((error) => done.fail(error));
    });

    it('doesn\'t overwrite an existing record.', (done) => {
      let timeoutID = undefined;

      store.set(primaryKey, entity, ttl)
        .then((bundle) => {
          timeoutID = bundle.timeoutID;
          return store.set(primaryKey, {access_token: 'ABC'}, ttl);
        })
        .catch((error) => {
          expect(error).toEqual(jasmine.any(Store.RecordAlreadyExistsError));
          done();
        });
    });
  });

  describe('"get"', () => {
    const entity = {access_token: 'iJCRCjc8oROO-dkrkqCXOade997oa8Jhbz6awMUQPBQo80VenWqp_oNvfY6AnU5BxEsdDPOBfBP-uz_b0gAKBQ=='};
    const ttl = 900;

    it('returns a saved record together with it\'s expiration.', (done) => {
      const primaryKey = 'access-tokens';

      store.set(primaryKey, entity, ttl)
        .then(() => {
          store.get(primaryKey)
            .then((bundle) => expect(bundle.payload).toEqual(entity))
            .then(done);
        })
        .catch((error) => done.fail(error));
    });

    it('returns a saved record with an "@" in it\'s primary key.', (done) => {
      const primaryKey = '@access@tokens';

      store.set(primaryKey, entity, ttl)
        .then(() => {
          store.get(primaryKey)
            .then((bundle) => expect(bundle.payload).toEqual(entity))
            .then(done);
        })
        .catch((error) => done.fail(error));
    });

    it('returns a non-existent record as "undefined".', (done) => {
      const primaryKey = 'not-found';

      store.get(primaryKey)
        .then((bundle) => expect(bundle).toBeUndefined())
        .then(done)
        .catch((error) => done.fail(error));
    });
  });

  describe('"init"', () => {
    it('initially reads data from persistent storage.', (done) => {
      window.localStorage.setItem(`${DATABASE_NAME}@${TABLE_NAME}@123`, JSON.stringify({
        expires: 2 * Date.now(),
        payload: {token: '123'}
      }));

      window.localStorage.setItem(`${DATABASE_NAME}@${TABLE_NAME}@a2c`, JSON.stringify({
        expires: 2 * Date.now(),
        payload: {token: 'a2c'}
      }));

      window.localStorage.setItem(`${DATABASE_NAME}@${TABLE_NAME}@abc`, JSON.stringify({
        expires: 2 * Date.now(),
        payload: {token: 'abc'}
      }));

      store.init(TABLE_NAME)
        .then((bundles) => {
          expect(bundles.length).toBe(3);
          done();
        })
        .catch((error) => done.fail(error));
    });
  });

  describe('"startTimer"', () => {
    const entity = {access_token: 'iJCRCjc8oROO-dkrkqCXOade997oa8Jhbz6awMUQPBQo80VenWqp_oNvfY6AnU5BxEsdDPOBfBP-uz_b0gAKBQ=='};
    const primaryKey = 'access-tokens';
    const minuteInMillis = 60000;

    beforeEach(() => jasmine.clock().install());
    afterEach(() => jasmine.clock().uninstall());

    it('publishes an event when an entity expires.', (done) => {
      store.on(Store.TransientStore.TOPIC.EXPIRED, (expiredBundle) => {
        expect(expiredBundle.payload).toBe(entity);
        expect(expiredBundle.primaryKey).toBe(primaryKey);
        done();
      });

      store.set(primaryKey, entity, minuteInMillis)
        .then(() => jasmine.clock().tick(minuteInMillis + 1))
        .catch((error) => done.fail(error));
    });

    it('deletes expired entities.', (done) => {
      store.set(primaryKey, entity, minuteInMillis)
        .then(() => {
          jasmine.clock().tick(minuteInMillis + 1);
          return store.get(primaryKey);
        })
        .then((bundle) => {
          expect(bundle).toBeUndefined();
          done();
        })
        .catch((error) => done.fail(error));
    });

    it('keeps the same timer when being called multiple times.', (done) => {
      let timeoutID = undefined;

      store.set(primaryKey, entity, minuteInMillis)
        .then((bundle) => {
          timeoutID = bundle.timeoutID;
          const cacheKey = store.constructCacheKey(primaryKey);
          return store.startTimer(cacheKey, minuteInMillis);
        })
        .then((bundle) => {
          expect(bundle.timeoutID).toBe(timeoutID);
          done();
        })
        .catch((error) => done.fail(error));
    });
  });
});
