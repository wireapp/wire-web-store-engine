import {TransientStore} from './store';
import {IndexedDBEngine, InMemoryEngine, LocalStorageEngine} from './engine';

export = {
  Store: {
    TransientStore,
  },
  StoreEngine: {
    IndexedDBEngine,
    InMemoryEngine,
    LocalStorageEngine,
  }
};
