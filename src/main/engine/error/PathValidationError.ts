export default class PathValidationError extends Error {
  static get TYPE() {
    return {
      PATH_TRAVERSAL: 'Path traversal has been detected. Aborting.',
    };
  }

  constructor(public message: string) {
    super(message);
    Object.setPrototypeOf(this, PathValidationError.prototype);

    this.message = message;
    this.name = (<any>this).constructor.name;
    this.stack = new Error().stack;
  }
}
