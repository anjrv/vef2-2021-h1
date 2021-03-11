import dotenv from 'dotenv';
import util from 'util';
import fs from 'fs';

import { query } from './db.js';
import { uploadImagesFromDisk } from './images.js';
import requireEnv from './utils/requireEnv.js';

dotenv.config();

const readFileAsync = util.promisify(fs.readFile);
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

  // TODO .schema

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
