import {EventEmitter} from 'events';

export class Bundle {
  public expires: number;
  public payload: any;
}

export default class ExpirationalStore extends EventEmitter {
  private bundles = {};

  public static TOPIC = {
    EXPIRED: 'expired'
  };

  constructor(private store: CRUDEngine, private tableName: string) {
    super();
    this.init();
  }

  private init(): void {
    let cacheKeys: Array<string> = [];

    this.store.readAllPrimaryKeys(this.tableName)
      .then((primaryKeys: Array<string>) => {
        const readBundles: Array<Promise<Bundle>> = [];

        primaryKeys.forEach((primaryKey: string) => {
          const cacheKey: string = this.constructCacheKey(primaryKey);
          cacheKeys.push(cacheKey);
          readBundles.push(this.store.read<Bundle>(this.tableName, primaryKey));
        });

        return Promise.all(readBundles);
      })
      .then((bundles: Array<Bundle>) => {
        for (let index in bundles) {
          const bundle = bundles[index];
          const cacheKey = cacheKeys[index];

          this.startTimer(cacheKey, bundle.expires);
          this.bundles[cacheKey] = bundle;
        }
      });
  }

  private constructCacheKey(primaryKey: string): string {
    return `${this.tableName}@${primaryKey}`;
  };

  public get(primaryKey: string): Promise<Bundle> {
    const cacheBundle = this.bundles[this.constructCacheKey(primaryKey)];
    if (typeof cacheBundle !== 'undefined') {
      return Promise.resolve(cacheBundle);
    }
    return this.store.read(this.tableName, primaryKey);
  }

  public set(primaryKey: string, entity: any, ttl: number): Promise<Bundle> {
    const bundle = {
      expires: Date.now() + ttl,
      payload: entity,
    };

    return this.save(primaryKey, bundle)
      .then((cacheKey: string) => this.startTimer(cacheKey, ttl))
      .then(() => bundle);
  }

  private save(primaryKey: string, bundle: Bundle): Promise<string> {
    const cacheKey: string = this.constructCacheKey(primaryKey);

    return Promise.all([
      this.saveInStore(primaryKey, bundle),
      this.saveInCache(cacheKey, bundle)
    ]).then(() => cacheKey);
  }

  private saveInStore(primaryKey: string, bundle: Bundle): Promise<string> {
    return this.store.create(this.tableName, primaryKey, bundle);
  }

  private saveInCache(cacheKey: string, bundle: Bundle): Object {
    return this.bundles[cacheKey] = bundle;
  }

  private delete(cacheKey: string): Promise<string> {
    const primaryKey = cacheKey.replace(`${this.tableName}@`, '');

    return Promise.all([
      this.deleteFromStore(primaryKey),
      this.deleteFromCache(cacheKey)
    ]).then(() => cacheKey);
  }

  private deleteFromStore(primaryKey: string): Promise<string> {
    return this.store.delete(this.tableName, primaryKey);
  }

  private deleteFromCache(cacheKey: string): string {
    delete this.bundles[cacheKey];
    return cacheKey;
  }

  private expireEntity(cacheKey: string) {
    const expiredEntity = Object.assign({}, this.bundles[cacheKey]);
    this.delete(cacheKey).then((cacheKey) => this.emit(ExpirationalStore.TOPIC.EXPIRED, expiredEntity));
  }

  private startTimer(cacheKey: string, ttl: number): number {
    const {expires, timeoutID} = this.bundles[cacheKey];
    if (expires < Date.now()) {
      this.expireEntity(cacheKey);
    } else {
      clearTimeout(timeoutID);
      setTimeout(() => this.expireEntity(cacheKey), ttl);
    }
    return expires;
  }
}
