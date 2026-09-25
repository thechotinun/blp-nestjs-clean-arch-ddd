export enum DomainErrorType {
  VALIDATION = 'VALIDATION',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  BUSINESS_RULE = 'BUSINESS_RULE',
}

/**
 * Base for all business errors. HTTP-agnostic: presentation maps `type` to a status code.
 *
 * @example
 * export class ExampleNotFoundException extends DomainException {
 *   constructor() {
 *     super(DomainErrorType.NOT_FOUND, 100101, 'EXAMPLE_NOT_FOUND');
 *   }
 * }
 */
export abstract class DomainException extends Error {
  protected constructor(
    readonly type: DomainErrorType,
    readonly code: number,
    message: string,
    readonly errors: unknown[] = [],
  ) {
    super(message);
    this.name = new.target.name;
  }
}
