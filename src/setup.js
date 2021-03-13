import dotenv from 'dotenv';
import util from 'util';
import fs from 'fs';

import { uploadImagesFromDisk } from './images.js';
import { query } from './db.js';
import requireEnv from './utils/requireEnv.js';

const readFileAsync = util.promisify(fs.readFile);

dotenv.config();
requireEnv(['DATABASE_URL', 'CLOUDINARY_URL']);

const {
  DATABASE_URL: databaseUrl,
  CLOUDINARY_URL: cloudinaryUrl,
  IMAGE_FOLDER: imageFolder = './data/img',
} = process.env;

async function main() {
  console.info(`Set upp gagnagrunn á ${databaseUrl}`);
  console.info(`Set upp tengingu við Cloudinary á ${cloudinaryUrl}`);
  let images = [];

  try {
    const createTable = await readFileAsync('./sql/drop.sql');
    await query(createTable.toString('utf8'));
    console.info('Töflum hent');
  } catch (e) {
    console.error('Villa við að henda töflum:', e.message);
    return;
  }

  try {
    const createTable = await readFileAsync('./sql/schema.sql');
    await query(createTable.toString('utf8'));
    console.info('Tafla búin til');
  } catch (e) {
    console.error('Villa við að búa til töflu:', e.message);
    return;
  }

  try {
    const createData = await readFileAsync('./sql/insert-users.sql');
    await query(createData.toString('utf8'));
    console.info('Notendur búnir til');
  } catch (e) {
    console.error('Villa við að búa til notendur:', e.message);
    return;
  }

  try {
    images = await uploadImagesFromDisk(imageFolder);
    console.info(`Sendi ${images.length} myndir á Cloudinary`);
  } catch (e) {
    console.error('Villa við senda myndir á Cloudinary:', e.message);
  }
}

main().catch((err) => {
  console.error(err);
});
