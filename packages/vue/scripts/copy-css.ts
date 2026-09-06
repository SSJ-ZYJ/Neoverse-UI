import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const distDirectory = resolve(import.meta.dir, '../dist');
const outputPath = resolve(distDirectory, 'index.css');

await mkdir(distDirectory, { recursive: true });
await writeFile(outputPath, "@import '@neoverse-ui/tailwind/components.css';\n");
