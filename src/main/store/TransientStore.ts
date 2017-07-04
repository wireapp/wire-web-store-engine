import RecordAlreadyExistsError from './RecordAlreadyExistsError';
import TransientBundle from './TransientBundle';
import {CRUDEngine} from '../engine';
import {EventEmitter} from 'events';

export default class TransientStore extends EventEmitter {
  private bundles: { [index: string]: TransientBundle } = {};
  private tableName: string;

  public static TOPIC = {
    EXPIRED: 'expired'
  };

  constructor(private engine: CRUDEngine) {
    super();
  }

  public init(tableName: string): Promise<Array<TransientBundle>> {
    this.tableName = tableName;

    let cacheKeys: Array<string> = [];

    return this.engine.readAllPrimaryKeys(this.tableName)
      .then((primaryKeys: Array<string>) => {
        const readBundles: Array<Promise<TransientBundle>> = [];

        primaryKeys.forEach((primaryKey: string) => {
          const cacheKey: string = this.constructCacheKey(primaryKey);
          cacheKeys.push(cacheKey);
          readBundles.push(this.engine.read(this.tableName, primaryKey));
        });

        return Promise.all(readBundles);
      })
      .then((bundles: Array<TransientBundle>) => {
        for (let index in bundles) {
          const bundle = bundles[index];
          const cacheKey = cacheKeys[index];

          this.startTimer(cacheKey, bundle.expires)
            .then(() => {
              this.bundles[cacheKey] = bundle;
            });
        }

        return bundles;
      });
  }

  private constructCacheKey(primaryKey: string): string {
    return `${this.tableName}@${primaryKey}`;
  };

  private constructPrimaryKey(cacheKey: string): string {
    return cacheKey.replace(`${this.tableName}@`, '');
  }

  public get(primaryKey: string): Promise<TransientBundle> {
    return this.getFromCache(primaryKey)
      .then((cachedBundle: TransientBundle) => {
        return (cachedBundle !== undefined) ? cachedBundle : this.getFromStore(primaryKey);
      });
  }

  private getFromCache(primaryKey: string): Promise<TransientBundle> {
    const cacheBundle = this.bundles[this.constructCacheKey(primaryKey)];
    return Promise.resolve(cacheBundle);
  }

  private getFromStore(primaryKey: string): Promise<TransientBundle> {
    return this.engine.read(this.tableName, primaryKey);
  }

  public set<T>(primaryKey: string, entity: T, ttl: number): Promise<TransientBundle> {
    const bundle: TransientBundle = {
      expires: Date.now() + ttl,
      payload: entity,
    };

    return new Promise((resolve, reject) => {
      this.getFromCache(primaryKey)
        .then((cachedBundle: TransientBundle) => {
          if (cachedBundle) {
            const message = `Record with primary key "${primaryKey}" already exists in table "${this.tableName}" of database "${this.engine.storeName}".`;
            reject(new RecordAlreadyExistsError(message));
          } else {
            this.save(primaryKey, bundle)
              .then((cacheKey: string) => Promise.all([cacheKey, this.startTimer(cacheKey, ttl)]))
              .then(([cacheKey, bundle]: [string, TransientBundle]) => {
                // Note: Save bundle with timeoutID in cache (not in persistent storage)
                resolve(this.saveInCache(cacheKey, bundle));
              });
          }
        });
    });
  }

  private save<TransientBundle>(primaryKey: string, bundle: TransientBundle): Promise<string> {
    const cacheKey: string = this.constructCacheKey(primaryKey);

    return Promise.all([
      this.saveInStore(primaryKey, bundle),
      this.saveInCache(cacheKey, bundle)
    ]).then(() => cacheKey);
  }

  private saveInStore<TransientBundle>(primaryKey: string, bundle: TransientBundle): Promise<string> {
    return this.engine.create(this.tableName, primaryKey, bundle);
  }

  private saveInCache<TransientBundle>(cacheKey: string, bundle: TransientBundle): TransientBundle {
    return this.bundles[cacheKey] = (<any>bundle);
  }

  private delete(cacheKey: string): Promise<string> {
    const primaryKey = this.constructPrimaryKey(cacheKey);

    return Promise.all([
      this.deleteFromStore(primaryKey),
      this.deleteFromCache(cacheKey)
    ]).then(() => cacheKey);
  }

  private deleteFromStore(primaryKey: string): Promise<string> {
    return this.engine.delete(this.tableName, primaryKey);
  }

  private deleteFromCache(cacheKey: string): string {
    const timeoutID = this.bundles[cacheKey].timeoutID;
    if (timeoutID) {
      clearTimeout((<any>timeoutID));
    }
    delete this.bundles[cacheKey];
    return cacheKey;
  }

  private expireEntity(cacheKey: string) {
    const expiredEntity = Object.assign({}, this.bundles[cacheKey]);
    this.delete(cacheKey).then((cacheKey) => this.emit(TransientStore.TOPIC.EXPIRED, expiredEntity));
  }

  private startTimer(cacheKey: string, ttl: number): Promise<TransientBundle> {
    const primaryKey = this.constructPrimaryKey(cacheKey);
    return this.get(primaryKey)
      .then((bundle: TransientBundle) => {
        const {expires, timeoutID} = bundle;

        if (expires < Date.now()) {
          this.expireEntity(cacheKey);
        } else if (!timeoutID) {
          bundle.timeoutID = setTimeout(() => this.expireEntity(cacheKey), ttl);
        }

        return bundle;
      });
  }
}
