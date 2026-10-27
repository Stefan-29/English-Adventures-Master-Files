import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const output = path.resolve(
    process.env.CONTENT_EXPORT_DIR || path.join(os.tmpdir(), 'english-adventures-private-content')
);
const relativeOutput = path.relative(root, output);
if (relativeOutput === '' || (!relativeOutput.startsWith(`..${path.sep}`) && relativeOutput !== '..')) {
    throw new Error('Private content export must be outside the repository web root.');
}
if (fs.existsSync(output) && fs.readdirSync(output).length > 0) {
    throw new Error('Content export directory must be empty to prevent stale private topic files.');
}

function quoteSql(value) {
    return `'${String(value).replaceAll("'", "''")}'`;
}

function readTopicFiles() {
    return fs.readdirSync(path.join(root, 'config'))
        .filter(file => file.endsWith('.json') && file !== 'imageMapping.json')
        .map(file => {
            const id = path.basename(file, '.json');
            if (!/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/.test(id)) {
                throw new Error(`Topic filename "${file}" has an invalid id.`);
            }

            const config = JSON.parse(fs.readFileSync(path.join(root, 'config', file), 'utf8'));
            if (!config.dataFile || !config.siteSettings?.title || !config.lesson) {
                throw new Error(`Topic "${id}" is missing required config fields.`);
            }
            const dataPath = path.resolve(root, config.dataFile);
            const relativeDataPath = path.relative(root, dataPath);
            if (
                relativeDataPath.startsWith(`..${path.sep}`)
                || path.isAbsolute(relativeDataPath)
                || !relativeDataPath.startsWith(`reproducibility${path.sep}`)
                || !fs.existsSync(dataPath)
            ) {
                throw new Error(`Topic "${id}" references an invalid activity data path.`);
            }

            const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
            const title = config.siteSettings.title.replace(/^English Adventures:\s*/, '');
            return {
                id,
                title,
                description: `Explore ${config.lesson.title || title}.`,
                content: { config, data }
            };
        });
}

const topics = readTopicFiles();
fs.mkdirSync(output, { recursive: true });

for (const topic of topics) {
    fs.writeFileSync(
        path.join(output, `${topic.id}.json`),
        `${JSON.stringify(topic.content, null, 2)}\n`,
        { flag: 'wx' }
    );
}

const topicValues = topics.map(topic => `    (${[
    quoteSql(topic.id),
    quoteSql(topic.title),
    quoteSql(topic.description),
    quoteSql('other')
].join(', ')})`).join(',\n');
const sql = [
    '-- Apply this metadata seed in the Supabase SQL Editor.',
    '-- Existing is_free settings are preserved; newly inserted topics default to locked.',
    'insert into public.topics (id, title, description, tense_group)',
    'values',
    `${topicValues}`,
    'on conflict (id) do update set',
    '    title = excluded.title,',
    '    description = excluded.description,',
    '    tense_group = excluded.tense_group;',
    ''
].join('\n');
fs.writeFileSync(path.join(output, 'topics.sql'), sql, { encoding: 'utf8', flag: 'wx' });

console.log(`Exported ${topics.length} private topic JSON files outside the repository.`);
console.log(`Metadata seed: ${path.join(output, 'topics.sql')}`);
