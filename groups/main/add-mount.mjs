import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, '..', 'project', 'store', 'messages.db');

const db = new Database(dbPath);

// Get main group
const mainGroup = db.prepare('SELECT * FROM registered_groups WHERE folder = ?').get('main');

if (!mainGroup) {
  console.error('Main group not found!');
  process.exit(1);
}

console.log('Current main group config:');
console.log(JSON.stringify(mainGroup, null, 2));

// Parse existing container config
const containerConfig = mainGroup.container_config
  ? JSON.parse(mainGroup.container_config)
  : {};

// Add schuldnix mount
if (!containerConfig.additionalMounts) {
  containerConfig.additionalMounts = [];
}

// Check if mount already exists
const existingMount = containerConfig.additionalMounts.find(
  m => m.containerPath === 'schuldnix'
);

if (existingMount) {
  console.log('\nMount already exists!');
} else {
  containerConfig.additionalMounts.push({
    hostPath: '/Users/luis/projects/schuldnix',
    containerPath: 'schuldnix',
    readonly: false
  });

  // Update database
  db.prepare(
    'UPDATE registered_groups SET container_config = ? WHERE jid = ?'
  ).run(JSON.stringify(containerConfig), mainGroup.jid);

  console.log('\n✓ Mount added successfully!');
  console.log('\nUpdated container config:');
  console.log(JSON.stringify(containerConfig, null, 2));
  console.log('\n⚠️  Please restart the NanoClaw service for changes to take effect.');
}

db.close();
