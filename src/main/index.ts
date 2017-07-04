import {TransientStore} from './store';
import {IndexedDBEngine, LocalStorageEngine} from './engine';

module.exports = {
  engine: {
    IndexedDBEngine,
    LocalStorageEngine,
  },
  store: {
    TransientStore: TransientStore
  }
};
