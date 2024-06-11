import { defineConfig } from 'vite';
import { terser } from 'rollup-plugin-terser';

export default defineConfig({
	build: {
		lib: {
			entry: './src/index.ts',
			name: 'TabsBroadcast',
			fileName: (format) => `index.${format}.js`
		},
		rollupOptions: {
			plugins: [ terser() ],
			output: {
				dir: './',
				format: [ 'es', 'umd' ],
				name: 'TabsBroadcast'
			}
		},
		sourcemap: true
	}
});
