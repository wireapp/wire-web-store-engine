import {ExpiredBundle, RecordAlreadyExistsError, TransientBundle, TransientStore} from './store';
import {FileEngine, IndexedDBEngine, MemoryEngine, LocalStorageEngine} from './engine';
import {PathValidationError} from './engine/error';

export = {
  Store: {
    ExpiredBundle,
    RecordAlreadyExistsError,
    TransientBundle,
    TransientStore,
  },
  StoreEngine: {
    error: {
      PathValidationError,
    },
    FileEngine,
    IndexedDBEngine,
    MemoryEngine,
    LocalStorageEngine,
  }
};
