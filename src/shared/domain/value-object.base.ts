export abstract class ValueObject<TProps extends object> {
	protected readonly props: Readonly<TProps>;

	protected constructor(props: TProps) {
		this.props = Object.freeze({ ...props });
	}

	equals(other?: ValueObject<TProps>): boolean {
		if (!other) return false;
		if (this === other) return true;
		if (other.constructor !== this.constructor) return false;

		const keys = Object.keys(this.props) as (keyof TProps)[];
		if (keys.length !== Object.keys(other.props).length) return false;

		return keys.every((key) => isEqual(this.props[key], other.props[key]));
	}
}

function isEqual(a: unknown, b: unknown): boolean {
	if (a instanceof ValueObject && b instanceof ValueObject) return a.equals(b);
	if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
	return Object.is(a, b);
}
