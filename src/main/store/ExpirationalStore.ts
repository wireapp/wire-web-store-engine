import {EventEmitter} from 'events';

export default class ExpirationalStore extends EventEmitter {
  private bundles = {};

  public static TOPIC = {
    EXPIRED: 'expired'
  };

  constructor(private store: CRUDEngine, private tableName: string) {
    super();
  }

  private constructCacheKey(primaryKey: string): string {
    return `${this.tableName}@${primaryKey}`;
  };

  public get(primaryKey: string): { expires: number, payload: any } {
    return this.bundles[this.constructCacheKey(primaryKey)];
  }

  public set(primaryKey: string, entity: any, ttl: number): Promise<any> {
    const bundle = {
      expires: Date.now() + ttl,
      payload: entity,
    };

    return this.save(primaryKey, bundle)
      .then((cacheKey: string) => this.startTimer(cacheKey, ttl))
      .then(() => bundle);
  }

  private save(primaryKey: string, bundle: { expires: number, payload: any }): Promise<string> {
    const cacheKey: string = this.constructCacheKey(primaryKey);

    return Promise.all([
      this.saveInStore(primaryKey, bundle),
      this.saveInCache(cacheKey, bundle)
    ]).then(() => cacheKey);
  }

  private saveInStore(primaryKey: string, bundle: Object): Promise<string> {
    return this.store.create(this.tableName, primaryKey, bundle);
  }

  private saveInCache(cacheKey: string, bundle: Object): Object {
    return this.bundles[cacheKey] = bundle;
  }

  private delete(cacheKey: string): Promise<string> {
    const pattern = `${this.tableName}@`;
    const start = cacheKey.lastIndexOf(pattern) + pattern.length;
    const primaryKey = cacheKey.substr(start);

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

  private startTimer(cacheKey: string, ttl: number): number {
    const {expires, timeoutID} = this.bundles[cacheKey];
    clearTimeout(timeoutID);
    setTimeout(() => {
      const expiredEntity = Object.assign({}, this.bundles[cacheKey]);
      this.delete(cacheKey).then((cacheKey) => this.emit(ExpirationalStore.TOPIC.EXPIRED, expiredEntity));
    }, ttl);
    return expires;
  }
}
