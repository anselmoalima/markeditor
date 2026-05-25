/**
 * Workaround for fflate 0.8.x API break in @arethetypeswrong/cli.
 *
 * attw's createPackageFromTarballData uses `new Gunzip(callback)` (old fflate API),
 * but fflate 0.8.x changed the constructor to `new Gunzip(opts, callback)`.
 * This causes a silent empty buffer and an unhandled TypeError on `data[0].filename`.
 *
 * Fix: decompress with Node's built-in zlib, untar with @andrewbranch/untar.js,
 * then create a Package object directly and pass it to checkPackage.
 */
import { execSync } from 'child_process';
import { readFileSync, rmSync, existsSync, realpathSync } from 'fs';
import { gunzipSync } from 'zlib';
import { resolve, dirname } from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

/** Minimal POSIX tar extractor — returns array of { filename, fileData } entries. */
function extractTar(buf) {
  const files = [];
  let offset = 0;
  while (offset + 512 <= buf.length) {
    const header = buf.subarray(offset, offset + 512);
    if (header.every((b) => b === 0)) break; // two zero blocks = end of archive
    const filename = String.fromCharCode(...header.subarray(0, 100)).replace(/\0.*/, '');
    if (!filename) { offset += 512; continue; }
    const sizeOctal = String.fromCharCode(...header.subarray(124, 136)).trim().replace(/\0.*/, '');
    const size = parseInt(sizeOctal, 8) || 0;
    const type = String.fromCharCode(header[156]);
    offset += 512;
    if (type === '0' || type === '' || type === '\0') {
      files.push({ filename, fileData: buf.subarray(offset, offset + size) });
    }
    offset += Math.ceil(size / 512) * 512;
  }
  return files;
}

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const pkgRoot = resolve(__dirname, '..');

const pkgJson = JSON.parse(readFileSync(resolve(pkgRoot, 'package.json'), 'utf-8'));
const { name, version } = pkgJson;
const tgzFile = `${name}-${version}.tgz`;
const tgzPath = resolve(pkgRoot, tgzFile);

try {
  execSync('npm pack', { cwd: pkgRoot, stdio: 'pipe' });

  const tgzData = readFileSync(tgzPath);
  const tarData = gunzipSync(tgzData);

  const rawFiles = extractTar(tarData);

  const prefix = rawFiles[0].filename.substring(0, rawFiles[0].filename.indexOf('/') + 1);
  const filesMap = {};
  for (const file of rawFiles) {
    const rel = file.filename.substring(prefix.length);
    filesMap[`/node_modules/${name}/${rel}`] = file.fileData;
  }

  // Resolve @arethetypeswrong/core through the CLI package.
  // pnpm uses symlinks; realpathSync follows them to the virtual store where
  // @arethetypeswrong/core is accessible as a sibling.
  const cliPkgJson = resolve(pkgRoot, 'node_modules/@arethetypeswrong/cli/package.json');
  const realCliDir = dirname(realpathSync(cliPkgJson));
  const corePath = createRequire(resolve(realCliDir, 'dist/index.js')).resolve('@arethetypeswrong/core');
  const { Package, checkPackage } = await import(corePath);
  const pkg = new Package(filesMap, name, version);

  const result = await checkPackage(pkg, {
    excludeEntrypoints: ['./styles', './styles.css', './package.json'],
  });

  if (!('problems' in result)) {
    console.error('Package has no types — unexpected for bob-editor');
    process.exit(1);
  }

  // node10 doesn't support exports maps at all, so NoResolution there is expected
  // for any subpath export. Only fail on modern resolution modes.
  const significantProblems = result.problems.filter(
    (p) => !(p.kind === 'NoResolution' && 'resolutionKind' in p && p.resolutionKind === 'node10'),
  );

  if (significantProblems.length === 0) {
    console.log('attw: no type resolution problems detected');
    process.exit(0);
  } else {
    console.error('attw: type resolution problems detected:');
    for (const p of significantProblems) {
      console.error(`  [${p.kind}]`, JSON.stringify(p));
    }
    process.exit(1);
  }
} finally {
  if (existsSync(tgzPath)) rmSync(tgzPath);
}
