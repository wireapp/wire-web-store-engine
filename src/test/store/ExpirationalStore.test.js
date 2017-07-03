import {ExpirationalStore} from '../../../dist/commonjs/store';
import {InMemoryEngine} from '../../../dist/commonjs/engine';

describe('store.ExpirationalStore', () => {
  let engine = undefined;
  let store = undefined;

  beforeEach(() => {
    engine = new InMemoryEngine('database-name');
    store = new ExpirationalStore(engine, 'table-name');
  });

  describe('"set"', () => {
    it('saves a record together with it\'s expiration.', (done) => {
      const entity = {
        access_token: 'iJCRCjc8oROO-dkrkqCXOade997oa8Jhbz6awMUQPBQo80VenWqp_oNvfY6AnU5BxEsdDPOBfBP-uz_b0gAKBQ==.v=1.k=1.d=1498600993.t=a.l=.u=aaf9a833-ef30-4c22-86a0-9adc8a15b3b4.c=15037015562284012115',
      };
      const primaryKey = 'access-tokens';
      const ttl = 900;

      store.set(primaryKey, entity, ttl)
        .then((bundle) => {
          expect(bundle.expires).toEqual(jasmine.any(Number));
          done();
        })
        .catch((error) => done.fail(error));
    });
  });

  describe('"get"', () => {
    it('returns a saved record together with it\'s expiration.', (done) => {
      const entity = {
        access_token: 'iJCRCjc8oROO-dkrkqCXOade997oa8Jhbz6awMUQPBQo80VenWqp_oNvfY6AnU5BxEsdDPOBfBP-uz_b0gAKBQ==.v=1.k=1.d=1498600993.t=a.l=.u=aaf9a833-ef30-4c22-86a0-9adc8a15b3b4.c=15037015562284012115',
      };
      const primaryKey = 'access-tokens';
      const ttl = 900;

      store.set(primaryKey, entity, ttl)
        .then(() => {
          store.get(primaryKey)
            .then((bundle) => expect(bundle.payload).toEqual(entity))
            .then(done);
        })
        .catch((error) => done.fail(error));
    });
  });

  describe('"startTimer"', () => {
    beforeEach(() => jasmine.clock().install());
    afterEach(() => jasmine.clock().uninstall());

    it('publishes an event when an entity expires.', (done) => {
      const entity = {
        access_token: 'iJCRCjc8oROO-dkrkqCXOade997oa8Jhbz6awMUQPBQo80VenWqp_oNvfY6AnU5BxEsdDPOBfBP-uz_b0gAKBQ==.v=1.k=1.d=1498600993.t=a.l=.u=aaf9a833-ef30-4c22-86a0-9adc8a15b3b4.c=15037015562284012115',
      };
      const primaryKey = 'access-tokens';
      const minuteInMillis = 60000;

      store.on(ExpirationalStore.TOPIC.EXPIRED, (bundle) => {
        expect(bundle.payload).toBe(entity);
        done();
      });

      store.set(primaryKey, entity, minuteInMillis)
        .then(() => jasmine.clock().tick(minuteInMillis + 1))
        .catch((error) => done.fail(error));
    });

    it('deletes expired entities.', (done) => {
      const entity = {
        access_token: 'iJCRCjc8oROO-dkrkqCXOade997oa8Jhbz6awMUQPBQo80VenWqp_oNvfY6AnU5BxEsdDPOBfBP-uz_b0gAKBQ==.v=1.k=1.d=1498600993.t=a.l=.u=aaf9a833-ef30-4c22-86a0-9adc8a15b3b4.c=15037015562284012115',
      };
      const primaryKey = 'access-tokens';
      const minuteInMillis = 60000;

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
  });
});
