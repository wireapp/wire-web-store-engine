import {EventEmitter} from 'events';

export class Bundle {
  public expires: number;
  public payload: any;
  public timeoutID?: number | NodeJS.Timer; // Note: Only cached values have a "timeoutID"
}

export default class ExpirationalStore extends EventEmitter {
  private bundles: { [index: string]: Bundle } = {};
  private tableName: string;

  public static TOPIC = {
    EXPIRED: 'expired'
  };

  constructor(private store: CRUDEngine) {
    super();
  }

  public init(tableName: string): Promise<Array<Bundle>> {
    this.tableName = tableName;

    let cacheKeys: Array<string> = [];

    return this.store.readAllPrimaryKeys(this.tableName)
      .then((primaryKeys: Array<string>) => {
        const readBundles: Array<Promise<Bundle>> = [];

        primaryKeys.forEach((primaryKey: string) => {
          const cacheKey: string = this.constructCacheKey(primaryKey);
          cacheKeys.push(cacheKey);
          readBundles.push(this.store.read(this.tableName, primaryKey));
        });

        return Promise.all(readBundles);
      })
      .then((bundles: Array<Bundle>) => {
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

  public get(primaryKey: string): Promise<Bundle> {
    const cacheBundle = this.bundles[this.constructCacheKey(primaryKey)];
    if (cacheBundle) {
      return Promise.resolve(cacheBundle);
    }
    return this.store.read(this.tableName, primaryKey);
  }

  public set<T>(primaryKey: string, entity: T, ttl: number): Promise<Bundle> {
    const bundle = {
      expires: Date.now() + ttl,
      payload: entity,
    };

    return this.save(primaryKey, bundle)
      .then((cacheKey: string) => {
        return Promise.all([cacheKey, this.startTimer(cacheKey, ttl)]);
      })
      .then(([cacheKey, bundle]: [string, Bundle]) => {
        // Note: Save bundle with timeoutID in cache (not in persistent storage)
        return this.saveInCache(cacheKey, bundle);
      });
  }

  private save<Bundle>(primaryKey: string, bundle: Bundle): Promise<string> {
    const cacheKey: string = this.constructCacheKey(primaryKey);

    return Promise.all([
      this.saveInStore(primaryKey, bundle),
      this.saveInCache(cacheKey, bundle)
    ]).then(() => cacheKey);
  }

  private saveInStore<Bundle>(primaryKey: string, bundle: Bundle): Promise<string> {
    return this.store.create(this.tableName, primaryKey, bundle);
  }

  private saveInCache<Bundle>(cacheKey: string, bundle: Bundle): Bundle {
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
    return this.store.delete(this.tableName, primaryKey);
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
    this.delete(cacheKey).then((cacheKey) => this.emit(ExpirationalStore.TOPIC.EXPIRED, expiredEntity));
  }

  private startTimer(cacheKey: string, ttl: number): Promise<Bundle> {
    const primaryKey = this.constructPrimaryKey(cacheKey);
    return this.get(primaryKey)
      .then((bundle: Bundle) => {
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
