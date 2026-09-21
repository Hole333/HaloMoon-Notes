import { createHash } from 'node:crypto';
import { createReadStream, existsSync, mkdirSync, cpSync, rmSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const notesRoot = root;
const blogCandidates = [
  process.env.HALOMOON_BLOG_DIR,
  join(dirname(root), '.halomoon-build', 'HolyLinux'),
  'D:\\aaaaWordSpace\\HolyLinux-Astro',
  'C:\\Users\\G15\\Documents\\Codex\\2026-09-16\\woxi\\outputs\\HolyLinux-Astro',
].filter(Boolean);
const host = process.env.HALOMOON_DEPLOY_HOST || '47.116.62.248';
const user = process.env.HALOMOON_DEPLOY_USER || 'halomoon';
const key = process.env.HALOMOON_DEPLOY_KEY_FILE || 'C:\\Users\\G15\\Documents\\Codex\\2026-09-16\\woxi\\work\\halomoon-actions-ed25519';
const knownHosts = process.env.HALOMOON_KNOWN_HOSTS_FILE || 'C:\\Users\\G15\\Documents\\Codex\\2026-09-16\\woxi\\work\\halomoon-known-hosts';

function run(command, args, cwd, env = process.env) {
  const result = spawnSync(command, args, {
    cwd,
    env,
    stdio: 'inherit',
    shell: process.platform === 'win32' && /\\.(cmd|bat)$/i.test(command),
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(command + ' exited with code ' + result.status);
}

function capture(command, args, cwd, timeoutMs) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { cwd, shell: false, stdio: ['ignore', 'pipe', 'inherit'] });
    let output = '';
    child.stdout.on('data', (chunk) => { output += chunk; });
    const timer = setTimeout(() => { child.kill(); reject(new Error(command + ' timed out')); }, timeoutMs);
    child.on('error', reject);
    child.on('close', (code) => {
      clearTimeout(timer);
      code === 0 ? resolvePromise(output.trim()) : reject(new Error(command + ' exited with code ' + code));
    });
  });
}

function sha256(file) {
  return new Promise((resolvePromise, reject) => {
    const hash = createHash('sha256');
    const stream = createReadStream(file);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolvePromise(hash.digest('hex')));
  });
}

function findBlog() {
  return blogCandidates.find((candidate) =>
    existsSync(join(candidate, '.git')) &&
    (existsSync(join(candidate, 'node_modules', '.bin', 'astro.cmd')) || existsSync(join(candidate, 'node_modules', '.bin', 'astro'))),
  );
}

function ensureBlog() {
  const existing = findBlog();
  if (existing) return existing;
  const target = join(dirname(root), '.halomoon-build', 'HolyLinux');
  mkdirSync(dirname(target), { recursive: true });
  if (!existsSync(join(target, '.git'))) {
    run('git', ['-c', 'http.version=HTTP/1.1', 'clone', 'https://github.com/Hole333/HolyLinux.git', target], root);
  }
  return target;
}

function copyNotes(blog) {
  const target = join(blog, 'external-notes');
  const blogPath = resolve(blog);
  const targetPath = resolve(target);
  if (!targetPath.startsWith(blogPath + sep)) throw new Error('Notes target escaped blog directory.');
  rmSync(target, { recursive: true, force: true });
  cpSync(notesRoot, target, { recursive: true, filter: (source) => !source.split(sep).includes('.git') });
}

try {
  const blog = ensureBlog();
  console.log('Using blog source: ' + blog);
  copyNotes(blog);
  const npmCli = join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js');
  const astroCli = join(blog, 'node_modules', 'astro', 'bin', 'astro.mjs');
  if (existsSync(join(blog, 'node_modules', 'astro', 'bin', 'astro.mjs'))) {
    console.log('Reusing existing blog dependencies.');
  } else {
    run(process.execPath, [npmCli, 'ci', '--no-audit', '--no-fund'], blog);
  }
  run(process.execPath, ['scripts/sync-notes.mjs'], blog, { ...process.env, CI: '1' });
  run(process.execPath, [astroCli, 'build'], blog, { ...process.env, CI: '1' });

  const archive = join(root, 'site-local.tar.gz');
  run('tar', ['-czf', archive, '-C', join(blog, 'dist'), '.'], blog);
  const commit = await capture('git', ['rev-parse', 'HEAD'], blog, 10000);
  const localHash = await sha256(archive);
  const destination = user + '@' + host;
  const sshArgs = [
    '-i', key, '-o', 'IdentitiesOnly=yes',
    '-o', 'UserKnownHostsFile=' + knownHosts,
    '-o', 'StrictHostKeyChecking=yes', '-o', 'BatchMode=yes',
    '-o', 'ConnectTimeout=15', '-o', 'ServerAliveInterval=10',
    '-o', 'ServerAliveCountMax=3', '-o', 'IPQoS=throughput',
  ];
  const cleanup = 'pkill -u ' + user + ' -x sftp-server || true; ' +
    'pkill -u ' + user + " -f '^scp -t /home/" + user + "/site.tar.gz$' || true; " +
    'rm -f /home/' + user + '/site.tar.gz';

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await capture('ssh', [...sshArgs, destination, cleanup], root, 30000);
      await capture('scp', ['-O', ...sshArgs, archive, destination + ':/home/' + user + '/site.tar.gz'], root, 180000);
      break;
    } catch (error) {
      if (attempt === 3) throw error;
      console.log('Upload failed; retrying in ' + (attempt * 5) + ' seconds...');
      await new Promise((resolvePromise) => setTimeout(resolvePromise, attempt * 5000));
    }
  }

  const remoteHash = await capture('ssh', [...sshArgs, destination, 'sha256sum /home/' + user + '/site.tar.gz'], root, 30000);
  if (!remoteHash.startsWith(localHash)) throw new Error('Archive checksum mismatch.');
  await capture('ssh', [...sshArgs, destination, 'sudo /usr/local/sbin/deploy-halomoon ' + commit], root, 120000);
  console.log('Local deployment completed successfully.');
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
