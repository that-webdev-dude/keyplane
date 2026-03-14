export type KeyplaneErrorDetails = Readonly<Record<string, unknown>>;

export interface KeyplaneErrorOptions {
  details?: KeyplaneErrorDetails;
  cause?: unknown;
}

export class KeyplaneError extends Error {
  readonly code: string;
  readonly details?: KeyplaneErrorDetails;
  readonly cause?: unknown;

  constructor(
    code: string,
    message: string,
    options?: KeyplaneErrorOptions,
  ) {
    super(message);
    this.name = "KeyplaneError";
    this.code = code;
    this.details = options?.details;
    this.cause = options?.cause;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}
