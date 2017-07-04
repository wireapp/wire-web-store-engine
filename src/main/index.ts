import {ExpirationalStore} from './store';
import {IndexedDBEngine, LocalStorageEngine} from './engine';

module.exports = {
  engine: {
    IndexedDBEngine,
    LocalStorageEngine,
  },
  store: {
    ExpirationalStore: ExpirationalStore
  }
};
