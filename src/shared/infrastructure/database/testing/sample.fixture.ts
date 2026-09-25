// Test-only aggregate + ORM entity so shared specs don't depend on any module.
// Excluded from the build (tsconfig.build.json: **/testing/**).
import { Column, Entity } from 'typeorm';
import { AggregateRoot } from '../../../domain/index.js';
import { BaseOrmEntity } from '../base.orm-entity.js';
import type { Mapper } from '../mapper.interface.js';

export class Sample extends AggregateRoot<{ name: string }> {
	static create(name: string) {
		return new Sample({ name });
	}

	static restore(name: string, id: string, isActive: boolean) {
		return new Sample({ name }, id, isActive);
	}

	get name() {
		return this.props.name;
	}
}

@Entity('samples')
export class SampleOrmEntity extends BaseOrmEntity {
	@Column({ name: 'name', type: 'varchar' })
	name: string;
}

export const sampleMapper: Mapper<Sample, SampleOrmEntity> = {
	toDomain: (r) => Sample.restore(r.name, r.id, r.isActive),
	toPersistence: (s) =>
		Object.assign(new SampleOrmEntity(), {
			id: s.id,
			isActive: s.isActive,
			name: s.name,
		}),
};

const date = new Date('2026-09-24T10:51:52.557Z');

export const sampleRecord = (id: string, name: string, overrides: Partial<SampleOrmEntity> = {}) =>
	Object.assign(new SampleOrmEntity(), {
		id,
		name,
		isActive: true,
		createdDate: date,
		createdBy: 'user-1',
		updatedDate: date,
		updatedBy: null,
		deletedDate: null,
		deletedBy: null,
		...overrides,
	});
