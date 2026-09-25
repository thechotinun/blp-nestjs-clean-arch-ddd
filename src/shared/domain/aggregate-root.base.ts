import type { DomainEvent } from './domain-event.js';
import { Entity } from './entity.base.js';

export abstract class AggregateRoot<
  TProps extends object,
> extends Entity<TProps> {
  private _domainEvents: DomainEvent[] = [];

  get domainEvents(): readonly DomainEvent[] {
    return this._domainEvents;
  }

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  pullDomainEvents(): DomainEvent[] {
    const events = this._domainEvents;
    this._domainEvents = [];
    return events;
  }
}
