import {EventEmitter} from 'events';

export default class ExpirationalStore extends EventEmitter {
  private timeouts = {};
  private tokens = {};

  public static TOPIC = {
    WILL_EXPIRE: 'will-expire'
  };

  constructor(private store: CRUDEngine, private tableName: string) {
    super();
  }

  public set(primaryKey: string, entity: any, ttl: number): Promise<any> {
    return Promise.resolve()
      .then(() => {
        return this.saveWithExpiration(primaryKey, entity, ttl);
      }).then(() => {
        this.tokens[primaryKey] = entity;
        return entity;
      });
  }

  private saveWithExpiration(primaryKey: string, entity: any, ttl: number): Promise<string> {
    const expiringPayload = {
      expires: this.scheduleExpiration(primaryKey, ttl),
      payload: entity
    };

    return this.store.create(this.tableName, primaryKey, entity);
  }

  private scheduleExpiration(primaryKey: string, ttl: number): number {
    const timeoutID = this.timeouts[primaryKey];
    clearTimeout(timeoutID);

    const expires: number = Date.now() + ttl;

    setTimeout(() => {
      this.emit(ExpirationalStore.TOPIC.WILL_EXPIRE, this.tokens[primaryKey]);
    }, ttl);

    return expires;
  }
}
