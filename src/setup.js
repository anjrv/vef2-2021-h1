/**
 * Setur upp gagnagrunn og gögn fyrir verkefni.
 * Byrjar á að henda *öllu* sem er nú þegar til og býr til frá grunni.
 * Nyndir eru geymdar í Cloudinary.
 */
import dotenv from 'dotenv';
import util from 'util';
import fs from 'fs';

import { uploadImagesFromDisk } from './images.js';
import { importData } from './import_from_csv.js';
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

  // Fylki með myndum og slóðum á Cloudinary
  let images = [];

  // Henda töflum
  try {
    const createTable = await readFileAsync('./sql/drop.sql');
    await query(createTable.toString('utf8'));
    console.info('Töflum hent');
  } catch (e) {
    console.error('Villa við að henda töflum:', e.message);
    return;
  }

  // Búa til töflur út frá skema
  try {
    const createTable = await readFileAsync('./sql/schema.sql');
    await query(createTable.toString('utf8'));
    console.info('Tafla búin til');
  } catch (e) {
    console.error('Villa við að búa til töflu:', e.message);
    return;
  }

  // Búa til notendur
  try {
    const createData = await readFileAsync('./sql/insert-users.sql');
    await query(createData.toString('utf8'));
    console.info('Notendur búnir til');
  } catch (e) {
    console.error('Villa við að búa til notendur:', e.message);
    return;
  }

  // Senda myndir á Cloudinary
  try {
    images = await uploadImagesFromDisk(imageFolder);
    console.info(`Sendi ${images.length} myndir á Cloudinary`);
  } catch (e) {
    console.error('Villa við senda myndir á Cloudinary:', e.message);
  }

  // Búa til gögn úr csv og setja í gagnagrunn
  try {
    await importData(images);
  } catch (e) {
    console.error('Villa við csv innlestur:', e.message);
  }
}

main().catch((err) => {
  console.error(err);
});
