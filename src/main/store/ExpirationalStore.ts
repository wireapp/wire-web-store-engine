import {EventEmitter} from 'events';

export default class ExpirationalStore extends EventEmitter {
  private bundles = {};

  public static TOPIC = {
    WILL_EXPIRE: 'will-expire'
  };

  constructor(private store: CRUDEngine, private tableName: string) {
    super();
  }

  public set(primaryKey: string, entity: any, ttl: number): Promise<any> {
    const bundle = {
      expires: Date.now() + ttl,
      payload: entity,
    };

    const cacheKey: string = `${this.tableName}@${primaryKey}`;

    return Promise.all([
      this.saveInStore(primaryKey, bundle),
      this.saveInCache(cacheKey, bundle),
      this.startTimer(cacheKey, ttl),
    ]).then(() => bundle);
  }

  private saveInStore(primaryKey: string, bundle: Object): Promise<string> {
    return this.store.create(this.tableName, primaryKey, bundle);
  }

  private saveInCache(cacheKey: string, bundle: Object): Object {
    return this.bundles[cacheKey] = bundle;
  }

  private startTimer(cacheKey: string, ttl: number): number {
    const {expires, timeoutID} = this.bundles[cacheKey];
    clearTimeout(timeoutID);
    setTimeout(() => {
      this.emit(ExpirationalStore.TOPIC.WILL_EXPIRE, this.bundles[cacheKey]);
    }, ttl);
    return expires;
  }
}
