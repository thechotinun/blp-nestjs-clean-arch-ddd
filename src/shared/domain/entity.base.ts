import { randomUUID } from 'node:crypto';

export abstract class Entity<TProps extends object> {
  protected readonly props: TProps;
  private readonly _id: string;
  private _isActive: boolean;

  protected constructor(props: TProps, id?: string, isActive = true) {
    this._id = id ?? randomUUID();
    this.props = props;
    this._isActive = isActive;
  }

  get id(): string {
    return this._id;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  // Protected: subclasses expose these only when the business allows it.
  protected activate(): void {
    this._isActive = true;
  }

  protected deactivate(): void {
    this._isActive = false;
  }

  equals(other?: Entity<TProps>): boolean {
    if (!other) return false;
    if (this === other) return true;
    if (other.constructor !== this.constructor) return false;
    return this._id === other._id;
  }
}
