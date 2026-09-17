import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const notesRoot = join(root, 'notes');
process.chdir(root);
const prompt = createInterface({ input, output });
const categoryPattern = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;
const ask = async (label) => (await prompt.question(`${label}: `)).trim();
const quote = (value) => `'${value.replaceAll("'", "''")}'`;
const run = (command, args, accepted = [0]) => {
	const result = spawnSync(command, args, { cwd: root, stdio: 'inherit', shell: false });
	if (result.error) throw result.error;
	if (!accepted.includes(result.status)) throw new Error(`${command} ${args.join(' ')} failed with exit code ${result.status}`);
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

function prepareFile(file) {
	const content = readFileSync(file, 'utf8').replaceAll('\r\n', '\n');
	if (/^---\n[\s\S]*?\n---\n/.test(content)) return false;
	const heading = content.match(/^#\s+(.+)$/m);
	const title = heading?.[1].trim().replaceAll('\\_', '_') || basename(file, extname(file)).replaceAll('-', ' ');
	const body = (heading ? content.replace(heading[0], '') : content).trimStart();
	const firstParagraph = body.split(/\n\s*\n/)
		.map((part) => part.replace(/^#+\s*/gm, '').replace(/[*_`>\[\]()]/g, '').trim())
		.find(Boolean);
	const description = (firstParagraph || title).replace(/\s+/g, ' ').slice(0, 160);
	const category = relative(notesRoot, file).split(sep)[0];
	const date = formatDate();
	const frontmatter = [
		'---', `title: ${quote(title)}`, `description: ${quote(description)}`,
		`created: '${date}'`, `updated: '${date}'`, `tags: [${quote(category)}]`,
		'draft: false', '---', '',
	].join('\n');
	writeFileSync(file, frontmatter + body, 'utf8');
	console.log(`Prepared: ${relative(root, file)}`);
	return true;
}

function prepareNotes() {
	let count = 0;
	for (const file of listMarkdown(notesRoot)) if (prepareFile(file)) count += 1;
	console.log(count ? `Prepared ${count} Markdown file(s).` : 'Markdown metadata is ready.');
}

async function syncNotes() {
	run('git', ['pull', '--rebase', '--autostash']);
	prepareNotes();
	run('git', ['add', '-A']);
	if (run('git', ['diff', '--cached', '--quiet'], [0, 1]) === 0) {
		console.log('No note changes to publish.');
		return;
	}
	run('git', ['commit', '-m', `notes: publish ${formatStamp()}`]);
	run('git', ['push']);
	console.log('Published. GitHub Actions is updating the blog.');
}

async function newNote() {
	const categories = readdirSync(notesRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
	console.log('\nCategories:');
	categories.forEach((category, index) => console.log(`[${index + 1}] ${category}`));
	const choice = await ask('Choose a category number, or type a new category name');
	const index = Number(choice) - 1;
	const category = Number.isInteger(index) && index >= 0 && index < categories.length ? categories[index] : choice.toLowerCase();
	if (!categoryPattern.test(category)) throw new Error('Category names may contain lowercase letters, numbers, hyphens, and underscores only.');
	const categoryDirectory = join(notesRoot, category);
	mkdirSync(categoryDirectory, { recursive: true });
	const file = join(categoryDirectory, `note-${formatStamp()}.md`);
	if (existsSync(file)) throw new Error(`Note already exists: ${relative(root, file)}`);
	writeFileSync(file, '# Write the title here\n\nWrite the note here.\n', 'utf8');
	console.log(`Created: ${relative(root, file)}`);
	console.log('Use the first line as the title. Save and close the editor to publish.');
	openEditor(file);
	const content = readFileSync(file, 'utf8');
	if (!/^#\s+(.+)$/m.test(content) || !content.replace(/^#\s+.*$/m, '').trim()) {
		console.log('Not published yet. Add a title and body, save the file, then run publish-notes.cmd.');
		return;
	}
	await syncNotes();
}

async function deleteNote() {
	const files = listMarkdown(notesRoot).sort();
	if (!files.length) { console.log('No notes found.'); return; }
	files.forEach((file, index) => {
		const content = readFileSync(file, 'utf8');
		const title = content.match(/^title:\s*['"]?(.*?)['"]?$/m)?.[1] || content.match(/^#\s+(.+)$/m)?.[1] || basename(file);
		console.log(`[${index + 1}] ${title} (${relative(root, file)})`);
	});
	const selected = Number(await ask('Choose the note number to delete')) - 1;
	if (!Number.isInteger(selected) || selected < 0 || selected >= files.length) throw new Error('Invalid selection.');
	const target = resolve(files[selected]);
	const safeRoot = resolve(notesRoot);
	if (target !== safeRoot && !target.startsWith(safeRoot + sep)) throw new Error('Delete target is outside the notes directory.');
	if (await ask(`Type DELETE to remove ${relative(root, target)}`) !== 'DELETE') { console.log('Cancelled.'); return; }
	rmSync(target);
	await syncNotes();
}

async function menu() {
	console.log('\nHaloMoon Notes');
	console.log('[1] Create a Markdown note');
	console.log('[2] Publish all Markdown changes');
	console.log('[3] Delete a note and publish');
	console.log('[4] Pull remote changes');
	const choice = await ask('Choose an action');
	if (choice === '1') return newNote();
	if (choice === '2') return syncNotes();
	if (choice === '3') return deleteNote();
	if (choice === '4') return run('git', ['pull', '--rebase', '--autostash']);
	throw new Error('Invalid selection.');
}

const action = process.argv[2] || 'menu';
try {
	if (action === '--help' || action === 'help') console.log('Usage: node scripts/manage-notes.mjs [menu|new|delete|sync|pull|prepare]');
	else if (action === 'new') await newNote();
	else if (action === 'delete') await deleteNote();
	else if (action === 'sync') await syncNotes();
	else if (action === 'pull') run('git', ['pull', '--rebase', '--autostash']);
	else if (action === 'prepare') prepareNotes();
	else if (action === 'menu') await menu();
	else throw new Error('Unknown action. Use --help for usage.');
} catch (error) {
	console.error(`\n${error instanceof Error ? error.message : error}`);
	process.exitCode = 1;
} finally {
	prompt.close();
}
