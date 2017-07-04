import {TransientStore} from './store';
import {IndexedDBEngine, LocalStorageEngine} from './engine';

export = {
  engine: {
    IndexedDBEngine,
    LocalStorageEngine,
  },
  store: {
    TransientStore: TransientStore
  }
};
