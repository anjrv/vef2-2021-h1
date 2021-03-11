import util from 'util';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import cloudinary from 'cloudinary';

import debug from './utils/debug.js';

dotenv.config();

const {
  CLOUDINARY_CLOUD,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} = process.env;

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

const readDirAsync = util.promisify(fs.readdir);
const statAsync = util.promisify(fs.stat);
const resourcesAsync = util.promisify(cloudinary.v2.api.resources);
const uploadAsync = util.promisify(cloudinary.v2.uploader.upload);

let cachedListImages = null;

async function listImages() {
  if (cachedListImages) {
    return Promise.resolve(cachedListImages);
  }

  const res = await resourcesAsync({ max_results: 10 });

  cachedListImages = res.resources;

  return res.resources;
}

function imageComparer(current) {
  // TODO hér ættum við að bera saman fleiri hluti, t.d. width og height
  return (uploaded) => uploaded.bytes === current.size;
}

async function getImageIfUploaded(imagePath) {
  const uploaded = await listImages();

  const stat = await statAsync(imagePath);

  const current = { size: stat.size };

  const found = uploaded.find(imageComparer(current));

  return found;
}

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

export async function uploadImagesFromDisk(imageDir) {
  const imagesFromDisk = await readDirAsync(imageDir);

  const filteredImages = imagesFromDisk.filter(
    (i) => path.extname(i).toLowerCase() === '.jpg',
  );

  debug(`Bæti við ${filteredImages.length} myndum`);

  const images = [];

  for (let i = 0; i < filteredImages.length; i += 1) {
    const image = filteredImages[i];
    const imagePath = path.join(imageDir, image);
    const uploaded = await uploadImageIfNotUploaded(imagePath); // eslint-disable-line

    images.push(uploaded);
  }

  debug('Búið að senda myndir á Cloudinary');

  return images;
}
