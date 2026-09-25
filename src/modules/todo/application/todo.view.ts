import type { BaseView } from '../../../shared/application/index.js';

/** Read model returned by todo use cases (and by the API as-is). */
export interface TodoView extends BaseView {
	title: string;
	description: string | null;
}
