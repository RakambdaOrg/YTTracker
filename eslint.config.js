import tseslint from 'typescript-eslint';
import noUnsanitized from 'eslint-plugin-no-unsanitized';

export default tseslint.config(
	{ignores: ['.output/', '.wxt/', 'node_modules/', 'extras/']},
	...tseslint.configs.strictTypeChecked,
	noUnsanitized.configs.recommended,
	{
		languageOptions: {parserOptions: {projectService: true, tsconfigRootDir: import.meta.dirname}},
		rules: {'@typescript-eslint/restrict-template-expressions': ['error', {allowNumber: true}]},
	},
);
