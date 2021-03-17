import dotenv from 'dotenv';

import { toPositiveNumberOrDefault } from './validation.js';

dotenv.config();

const {
  HOST_NAME: host = '127.0.0.1:3000',
} = process.env;

/**
 * Bætir við viðeigandi metadata eins og við á (t.d. paging)
 *
 * @param {String} obj upplýsingar um metadata hlut
 * @param {String} path path hlekk
 * @param {object} param2 parameters
 * @returns metadata bætt við
 */
export default function addPageMetadata(
  obj,
  path,
  { offset = 0, limit = 10, length = 0 } = {},
) {
  if (obj.links) {
    return obj;
  }

  const offsetAsNumber = toPositiveNumberOrDefault(offset, 0);
  const limitAsNumber = toPositiveNumberOrDefault(limit, 10);
  const lengthAsNumber = toPositiveNumberOrDefault(length, 0);

  const newObj = { ...obj };

  const url = new URL(path, `http://${host}`);

  newObj.links = {
    self: {
      href: `${url}?offset=${offsetAsNumber}&limit=${limitAsNumber}`,
    },
  };

  if (offsetAsNumber > 0) {
    const prevOffset = offsetAsNumber - limitAsNumber;
    newObj.links.prev = {
      href: `${url}?offset=${prevOffset}&limit=${limitAsNumber}`,
    };
  }

  if (lengthAsNumber >= limitAsNumber) {
    const nextOffset = offsetAsNumber + limitAsNumber;
    newObj.links.next = {
      href: `${url}?offset=${nextOffset}&limit=${limitAsNumber}`,
    };
  }

  return newObj;
}
