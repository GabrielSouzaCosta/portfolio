import { build, context } from 'esbuild';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
export async function bundleStudio({ watch = false } = {}) {
  const options = {
    absWorkingDir:root,
    entryPoints:['js/main.js'],
    outfile:'js/studio.js',
    bundle:true,
    minify:true,
    format:'iife',
    target:['es2020'],
    legalComments:'eof',
    logLevel:'warning'
  };
  if (watch) {
    const compiler = await context(options);
    await compiler.watch();
    return compiler;
  }
  return build(options);
}
