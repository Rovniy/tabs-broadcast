import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
	{
		// `packages/**` are separate workspace packages with their own toolchains/lint.
		ignores: ['dist/**', 'coverage/**', 'node_modules/**', 'packages/**', '*.config.js', '*.config.ts'],
	},
	...tseslint.configs.recommended,
	{
		rules: {
			// `any` is used deliberately (untrusted payloads, `navigator.locks` feature-detection).
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-empty-function': 'off',
			'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
		},
	},
	prettier,
);
