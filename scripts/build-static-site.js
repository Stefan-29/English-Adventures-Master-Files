import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'dist');

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });

for (const file of ['index.html', 'auth.html', 'app.js', 'supabase-config.js']) {
    fs.copyFileSync(path.join(root, file), path.join(output, file));
}

const browserConfigPath = path.join(output, 'supabase-config.js');
let browserConfig = fs.readFileSync(browserConfigPath, 'utf8');
for (const key of ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'WHATSAPP_NUMBER']) {
    const value = process.env[key];
    if (value === undefined) continue;
    if (key === 'WHATSAPP_NUMBER' && value && !/^\+?[0-9\s()-]{8,24}$/.test(value)) {
        throw new Error('WHATSAPP_NUMBER must be a public phone number in international format.');
    }
    browserConfig = browserConfig.replace(
        new RegExp(`export const ${key} = ''`),
        `export const ${key} = ${JSON.stringify(value)}`
    );
}
fs.writeFileSync(browserConfigPath, browserConfig);

function copyDirectory(source, destination) {
    fs.mkdirSync(destination, { recursive: true });
    for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
        const sourcePath = path.join(source, entry.name);
        const destinationPath = path.join(destination, entry.name);
        if (entry.isDirectory()) {
            copyDirectory(sourcePath, destinationPath);
        } else if (entry.isFile()) {
            fs.copyFileSync(sourcePath, destinationPath);
        }
    }
}

for (const directory of ['assets', 'css', 'modules', 'legal']) {
    copyDirectory(path.join(root, directory), path.join(output, directory));
}

const publicConfigDirectory = path.join(output, 'config');
fs.mkdirSync(publicConfigDirectory, { recursive: true });
const publicImageMapping = JSON.parse(
    fs.readFileSync(path.join(root, 'config/imageMapping.json'), 'utf8')
);
const privateActivityImagePrefix = 'assets/images/future-tenses/';
for (const [activityId, image] of Object.entries(publicImageMapping)) {
    if (image.path?.startsWith(privateActivityImagePrefix)) delete publicImageMapping[activityId];
}
fs.writeFileSync(
    path.join(publicConfigDirectory, 'imageMapping.json'),
    `${JSON.stringify(publicImageMapping, null, 2)}\n`
);

// Keep topic-specific writing images private; the image service can fetch a public fallback.
fs.rmSync(path.join(output, 'assets/images/future-tenses'), { recursive: true, force: true });

console.log('Static site built in dist/; topic and activity JSON are excluded.');
