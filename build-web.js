const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['web/index.js'],
  bundle: true,
  format: 'esm',
  outfile: 'web/bundle.js',
  platform: 'browser',
  target: ['es2018'],
}).catch(() => process.exit(1));
