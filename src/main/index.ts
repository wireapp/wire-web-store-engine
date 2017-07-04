import {TransientStore} from './store';
import {IndexedDBEngine, InMemoryEngine, LocalStorageEngine} from './engine';

export = {
  engine: {
    IndexedDBEngine,
    InMemoryEngine,
    LocalStorageEngine,
  },
  store: {
    TransientStore: TransientStore
  }
};
