import type { Repository as OrmRepository } from 'typeorm';
import type { Mocked } from 'vitest';
import type { BaseView } from '../../application/index.js';
import { SampleOrmEntity, sampleRecord } from './testing/sample.fixture.js';
import { toBaseView, TypeOrmBaseQueryService } from './typeorm.query.base.js';

interface SampleView extends BaseView {
	name: string;
}

class SampleQueryService extends TypeOrmBaseQueryService<SampleOrmEntity, SampleView> {
	constructor(repository: OrmRepository<SampleOrmEntity>) {
		super(repository);
	}

	protected toView(record: SampleOrmEntity): SampleView {
		return { ...toBaseView(record), name: record.name };
	}
}

describe('TypeOrmBaseQueryService', () => {
	let orm: Mocked<OrmRepository<SampleOrmEntity>>;
	let query: SampleQueryService;

	beforeEach(() => {
		orm = {
			findOne: vi.fn(),
			findAndCount: vi.fn(),
		} as unknown as Mocked<OrmRepository<SampleOrmEntity>>;
		query = new SampleQueryService(orm);
	});

	it('findById should return the view with every audit field, in API order', async () => {
		orm.findOne.mockResolvedValue(sampleRecord('id-1', 'A'));

		const view = await query.findById('id-1');

		expect(Object.keys(view!)).toEqual([
			'id',
			'isActive',
			'createdDate',
			'createdBy',
			'updatedDate',
			'updatedBy',
			'deletedDate',
			'deletedBy',
			'name',
		]);
		expect(view).toMatchObject({ id: 'id-1', createdBy: 'user-1', name: 'A' });
	});

	it('findById should return null when missing', async () => {
		orm.findOne.mockResolvedValue(null);

		await expect(query.findById('x')).resolves.toBeNull();
	});

	it('toBaseView should turn missing values into null, never undefined', () => {
		const record = sampleRecord('id-1', 'A', {
			createdBy: undefined as never,
			deletedDate: undefined as never,
		});

		const view = toBaseView(record);

		expect(view.createdBy).toBeNull();
		expect(view.deletedDate).toBeNull();
	});

	it('findAll should page with skip/take, newest first', async () => {
		orm.findAndCount.mockResolvedValue([[sampleRecord('id-3', 'C')], 5]);

		const page = await query.findAll({ page: 3, perPage: 2 });

		expect(orm.findAndCount).toHaveBeenCalledWith({
			order: { createdDate: 'DESC' },
			skip: 4,
			take: 2,
		});
		expect(page.items.map((v) => v.name)).toEqual(['C']);
		expect(page).toMatchObject({ totalItems: 5, page: 3, perPage: 2 });
	});
});
