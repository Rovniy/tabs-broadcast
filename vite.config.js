import { defineConfig } from 'vite';
import { terser } from 'rollup-plugin-terser';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
	build: {
		lib: {
			entry: resolve(__dirname, 'src/index.ts'),
			name: 'TabsBroadcast',
			fileName: (format) => `tabs-broadcast.${format}.js`,
			formats: ['es', 'umd'],
		},
		minify: 'terser',
		sourcemap: true,
		target: 'esnext',
		rollupOptions: {
			output: {
				exports: 'named'
			}
		},
	},
	plugins: [
		dts({
			entryRoot: 'src',
			insertTypesEntry: true,
			outDir: 'dist',
			copyDtsFiles: true,
			rollupTypes: true
		})
	]
});
