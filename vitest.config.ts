import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
	// Resolves the path aliases declared in tsconfig.json, including the ones
	// added by `nest g library`.
	plugins: [tsconfigPaths()],
	test: {
		globals: true,
		root: './',
		// Unit/integration specs live next to the source; e2e specs (test/) run via vitest.config.e2e.ts.
		include: ['src/**/*.spec.ts'],
	},
});
