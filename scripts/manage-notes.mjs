import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const notesRoot = join(root, 'notes');
process.chdir(root);
const prompt = createInterface({ input, output });
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ask = async (label, fallback = '') =>
	(await prompt.question(`${label}${fallback ? ` (default: ${fallback})` : ""}: `)).trim() || fallback;
const quote = (value) => `'${value.replaceAll("'", "''")}'`;
const run = (command, args, accepted = [0]) => {
	const result = spawnSync(command, args, { cwd: root, stdio: 'inherit', shell: false });
	if (result.error) throw result.error;
	if (!accepted.includes(result.status)) throw new Error(`${command} ${args.join(" ")} failed with exit code ${result.status}`);
	return result.status;
};
const tryEditor = (command, args) => {
	const result = spawnSync(command, args, { cwd: root, stdio: 'inherit', shell: false });
	if (result.error?.code === 'ENOENT') return false;
	if (result.error) throw result.error;
	if (result.status !== 0) throw new Error(`${command} exited with code ${result.status}`);
	return true;
};
const openEditor = (file) => {
	const configured = process.env.VISUAL || process.env.EDITOR;
	if (configured && tryEditor(configured, [file])) return;
	if (tryEditor('code', ['--wait', file])) return;
	if (tryEditor('cursor', ['--wait', file])) return;
	if (process.platform === 'win32' && tryEditor('notepad.exe', [file])) return;
	for (const editor of ['nano', 'vim', 'vi']) if (tryEditor(editor, [file])) return;
	throw new Error('No editor was found. Set the EDITOR or VISUAL environment variable.');
};
const listMarkdown = (directory) => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
	const path = join(directory, entry.name);
	return entry.isDirectory() ? listMarkdown(path) : entry.isFile() && entry.name.endsWith('.md') ? [path] : [];
});
const formatDate = (date = new Date()) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
const formatStamp = (date = new Date()) => formatDate(date).replaceAll('-', '') + '-' + [date.getHours(), date.getMinutes(), date.getSeconds()].map((value) => String(value).padStart(2, '0')).join('');

async function syncNotes() {
	run('git', ['pull', '--rebase', '--autostash']);
	run('git', ['add', '-A']);
	if (run('git', ['diff', '--cached', '--quiet'], [0, 1]) === 0) {
		console.log('No note changes to sync.');
		return;
	}
	const fallback = `notes: sync ${formatDate()}`;
	const message = await ask('Commit message', fallback);
	run('git', ['commit', '-m', message]);
	run('git', ['push']);
	console.log('Notes pushed. GitHub Actions is updating the blog.');
}

async function newNote() {
	const categories = readdirSync(notesRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
	console.log('\nCategories:');
	categories.forEach((category, index) => console.log(`[${index + 1}] ${category}`));
	const choice = await ask('Choose a category number, or type a new lowercase category name');
	const index = Number(choice) - 1;
	const category = Number.isInteger(index) && index >= 0 && index < categories.length ? categories[index] : choice.toLowerCase();
	if (!slugPattern.test(category)) throw new Error('Category names may contain lowercase letters, numbers, and single hyphens only.');
	const categoryDirectory = join(notesRoot, category);
	mkdirSync(categoryDirectory, { recursive: true });

	const title = await ask('Note title');
	if (!title) throw new Error('Note title is required.');
	const description = await ask('Short description', title);
	const tagsInput = await ask('Tags, separated by commas', category);
	const slug = (await ask('URL slug', `note-${formatStamp()}`)).toLowerCase();
	if (!slugPattern.test(slug)) throw new Error('The slug may contain lowercase letters, numbers, and single hyphens only.');
	const file = join(categoryDirectory, `${slug}.md`);
	if (existsSync(file)) throw new Error(`Note already exists: ${relative(root, file)}`);
	const tags = tagsInput.split(',').map((tag) => tag.trim()).filter(Boolean);
	const date = formatDate();
	writeFileSync(file, [
		'---', `title: ${quote(title)}`, `description: ${quote(description)}`,
		`created: '${date}'`, `updated: '${date}'`, `tags: [${tags.map(quote).join(", ")}]`,
		'draft: false', '---', '', '<!-- Write the note here. Save and close the editor to continue publishing. -->', '',
	].join('\n'), 'utf8');
	console.log(`Created: ${relative(root, file)}`);
	openEditor(file);
	const body = readFileSync(file, 'utf8').replace(/^---[\s\S]*?---/, '').replace(/<!--[\s\S]*?-->/g, '').trim();
	if (!body) throw new Error('The note body is empty. The file was kept but not published.');
	await syncNotes();
}

async function deleteNote() {
	const files = listMarkdown(notesRoot).sort();
	if (!files.length) { console.log('No notes found.'); return; }
	files.forEach((file, index) => {
		const match = readFileSync(file, 'utf8').match(/^title:\s*['"]?(.*?)['"]?$/m);
		console.log(`[${index + 1}] ${match?.[1] || file.split(/[\\/]/).at(-1)} (${relative(root, file)})`);
	});
	const selected = Number(await ask('Choose the note number to delete')) - 1;
	if (!Number.isInteger(selected) || selected < 0 || selected >= files.length) throw new Error('Invalid selection.');
	const target = resolve(files[selected]);
	const safeRoot = resolve(notesRoot);
	if (target !== safeRoot && !target.startsWith(safeRoot + (process.platform === 'win32' ? '\\' : '/'))) throw new Error('Delete target is outside the notes directory.');
	if (await ask(`Type DELETE to remove ${relative(root, target)}`) !== 'DELETE') { console.log('Cancelled.'); return; }
	rmSync(target);
	await syncNotes();
}

async function menu() {
	console.log('\nHaloMoon Notes');
	console.log('[1] New note and publish');
	console.log('[2] Delete note and publish');
	console.log('[3] Sync existing changes');
	console.log('[4] Pull remote changes');
	const choice = await ask('Choose an action');
	if (choice === '1') return newNote();
	if (choice === '2') return deleteNote();
	if (choice === '3') return syncNotes();
	if (choice === '4') return run('git', ['pull', '--rebase', '--autostash']);
	throw new Error('Invalid selection.');
}

const action = process.argv[2] || 'menu';
try {
	if (action === '--help' || action === 'help') {
		console.log('Usage: node scripts/manage-notes.mjs [menu|new|delete|sync|pull]');
	} else if (action === 'new') await newNote();
	else if (action === 'delete') await deleteNote();
	else if (action === 'sync') await syncNotes();
	else if (action === 'pull') run('git', ['pull', '--rebase', '--autostash']);
	else if (action === 'menu') await menu();
	else throw new Error('Unknown action. Use --help for usage.');
} catch (error) {
	console.error(`\n${error instanceof Error ? error.message : error}`);
	process.exitCode = 1;
} finally {
	prompt.close();
}
