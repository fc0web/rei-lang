import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'index': 'src/index.ts',
    'core/index': 'src/core/index.ts',
    'gft/index': 'src/gft/index.ts',
    'lang/index': 'src/lang/index.ts',
    'genesis/index': 'src/genesis/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
});
