import util from 'util';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import cloudinary from 'cloudinary';

import requireEnv from './utils/requireEnv.js';
import debug from './utils/debug.js';

dotenv.config();
requireEnv(['CLOUDINARY_URL']);

const {
  CLOUDINARY_URL,
} = process.env;

// Cloudinary config úr env
cloudinary.config({
  cloud_name: CLOUDINARY_URL.substring(CLOUDINARY_URL.lastIndexOf('@') + 1),
  api_key: CLOUDINARY_URL.substring(CLOUDINARY_URL.lastIndexOf('/') + 1, CLOUDINARY_URL.lastIndexOf(':')),
  api_secret: CLOUDINARY_URL.substring(CLOUDINARY_URL.lastIndexOf(':') + 1, CLOUDINARY_URL.lastIndexOf('@')),
});

const readDirAsync = util.promisify(fs.readdir);
const statAsync = util.promisify(fs.stat);
const resourcesAsync = util.promisify(cloudinary.v2.api.resources);
const uploadAsync = util.promisify(cloudinary.v2.uploader.upload);

let cachedListImages = null;

/**
 * @returns fylki af myndum
 */
async function listImages() {
  if (cachedListImages) {
    return Promise.resolve(cachedListImages);
  }

  const res = await resourcesAsync({ max_results: 150 });

  cachedListImages = res.resources;

  return res.resources;
}

/**
 * Skoðar hvort stærðin á núverandi mynd er eins og á uploaded mynd
 *
 * @param {object} current núverandi mynd
 * @returns niðurstaða
 */
function imageComparer(current) {
  return (uploaded) => uploaded.bytes === current.size;
}

/**
 * Getter á mynd hlut
 *
 * @param {String} imagePath path á mynd sem á að leita eftir
 * @returns path á sömu mynd á cloudinary
 */
async function getImageIfUploaded(imagePath) {
  const uploaded = await listImages();

  const stat = await statAsync(imagePath);

  const current = { size: stat.size };

  const found = uploaded.find(imageComparer(current));

  return found;
}

/**
 * Uploadar mynd ef það er ekki nú þegar uploadað
 *
 * @param {String} imagePath path á mynd
 * @returns path á sömu mynd á cloudinary
 */
async function uploadImageIfNotUploaded(imagePath) {
  const alreadyUploaded = await getImageIfUploaded(imagePath);

  if (alreadyUploaded) {
    debug(`Mynd ${imagePath} þegar uploadað`);
    return alreadyUploaded.secure_url;
  }

  const uploaded = await uploadAsync(imagePath);
  debug(`Mynd ${imagePath} uploadað`);

  return uploaded.secure_url;
}

/**
 * Uploadar myndir úr imageDir ef þær eru ekki nú þegar til
 *
 * @param {String} imageDir path á möppu sem myndir eru í
 * @returns map af mynd key value pairs: imagepath, image hlekk á cloudinary
 */
export async function uploadImagesFromDisk(imageDir) {
  const imagesFromDisk = await readDirAsync(imageDir);

  const filteredImages = imagesFromDisk.filter(
    (i) => path.extname(i).toLowerCase() === '.jpg',
  );

  debug(`Bæti við ${filteredImages.length} myndum`);

  const images = new Map();

  for (let i = 0; i < filteredImages.length; i += 1) {
    const image = filteredImages[i];
    const imagePath = path.join(imageDir, image);
    const uploaded = await uploadImageIfNotUploaded(imagePath); // eslint-disable-line

    images.set(image, uploaded);
  }

  debug('Búið að senda myndir á Cloudinary');

  return images;
}
