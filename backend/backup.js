require('dotenv').config();
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

async function createMongoDBBackup() {
  try {
    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
      console.log('Utworzono katalog backups');
    }

    const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
    const backupFileName = `laptop-rental_backup_${timestamp}.gz`;
    const backupFilePath = path.join(backupDir, backupFileName);

    const dbUri = process.env.MONGO_URI;
    const dbName = dbUri.split('/').pop().split('?')[0];

    console.log(`Rozpoczynam backup bazy danych ${dbName}...`);

    const mongodump = spawn('mongodump', [
      `--uri=${dbUri}`,
      `--archive=${backupFilePath}`,
      '--gzip'
    ]);

    mongodump.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });

    mongodump.stderr.on('data', (data) => {
      console.log(`stderr: ${data}`);
    });

    mongodump.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ Backup został pomyślnie utworzony: ${backupFilePath}`);
        
        cleanupOldBackups(backupDir, 5);
      } else {
        console.log(`❌ Backup zakończony z kodem błędu: ${code}`);
      }
    });

  } catch (error) {
    console.error('Błąd tworzenia backupu:', error);
  }
}

// Funkcja czyszcząca stare kopie zapasowe
function cleanupOldBackups(directory, keepCount) {
  try {
    const files = fs.readdirSync(directory)
      .filter(file => file.startsWith('laptop-rental_backup_'))
      .map(file => ({
        name: file,
        path: path.join(directory, file),
        created: fs.statSync(path.join(directory, file)).birthtime
      }))
      .sort((a, b) => b.created - a.created);

    if (files.length > keepCount) {
      const filesToDelete = files.slice(keepCount);
      filesToDelete.forEach(file => {
        fs.unlinkSync(file.path);
        console.log(`🗑️ Usunięto starą kopię: ${file.name}`);
      });
    }
  } catch (error) {
    console.error('Błąd czyszczenia starych kopii:', error);
  }
}

createMongoDBBackup();