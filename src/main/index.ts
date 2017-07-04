import {RecordAlreadyExistsError, TransientBundle, TransientStore} from './store';
import {IndexedDBEngine, InMemoryEngine, LocalStorageEngine} from './engine';

export = {
  Store: {
    RecordAlreadyExistsError,
    TransientBundle,
    TransientStore,
  },
  StoreEngine: {
    IndexedDBEngine,
    InMemoryEngine,
    LocalStorageEngine,
  }
};
