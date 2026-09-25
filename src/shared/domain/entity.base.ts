import { randomUUID } from 'node:crypto';
import { type EntityAudit, newEntityAudit } from './entity-audit.js';

export abstract class Entity<TProps extends object> {
  protected readonly props: TProps;
  private readonly _id: string;
  private _audit: EntityAudit;

  protected constructor(props: TProps, id?: string, audit?: EntityAudit) {
    this._id = id ?? randomUUID();
    this.props = props;
    this._audit = audit ?? newEntityAudit();
  }

  get id(): string {
    return this._id;
  }

  get audit(): Readonly<EntityAudit> {
    return this._audit;
  }

  get isActive(): boolean {
    return this._audit.isActive;
  }

  // Protected: subclasses expose these only when the business allows it.
  protected activate(): void {
    this._audit = { ...this._audit, isActive: true };
  }

  protected deactivate(): void {
    this._audit = { ...this._audit, isActive: false };
  }

  equals(other?: Entity<TProps>): boolean {
    if (!other) return false;
    if (this === other) return true;
    if (other.constructor !== this.constructor) return false;
    return this._id === other._id;
  }
}
