import dotenv from 'dotenv';
import pkg from 'pg';

import debug from './utils/debug.js';
import { toPositiveNumberOrDefault } from './utils/validation.js';

dotenv.config();

// NODE_ENV til að komast hjá heroku SSL
const {
  DATABASE_URL: connectionString,
  NODE_ENV: nodeEnv = 'development',
} = process.env;

const { Client } = pkg;
const ssl = nodeEnv !== 'development' ? { rejectUnauthorized: false } : false;

/**
 * Framkvæmir skipun á gagnagrunn með gefnum upplýsingum
 *
 * @param {*} sqlQuery SQL skipun til að framkvæma
 * @param {*} values gildi til að setja inn í SQL skipun
 * @returns niðurstaða úr SQL query
 */
async function query(sqlQuery, values = []) {
  const client = new Client({ connectionString, ssl });
  await client.connect();

  let result;

  try {
    result = await client.query(sqlQuery, values);
  } finally {
    await client.end();
  }

  return result;
}

/**
 * Framkvæmir paged skipun á gagnagrunn með gefnum upplýsingum
 *
 * @param {*} sqlQuery SQL skipun til að framkvæma
 * @param {*} values gildi til að setja inn í SQL skipun
 * @returns niðurstaða úr SQL query
 */
async function pagedQuery(
  sqlQuery,
  values = [],
  { offset = 0, limit = 10 } = {},
) {
  // eslint-disable-next-line no-console
  console.assert(Array.isArray(values), 'values should be an array');

  const sqlLimit = values.length + 1;
  const sqlOffset = values.length + 2;
  const q = `${sqlQuery} LIMIT $${sqlLimit} OFFSET $${sqlOffset}`;

  const limitAsNumber = toPositiveNumberOrDefault(limit, 10);
  const offsetAsNumber = toPositiveNumberOrDefault(offset, 0);

  const combinedValues = values.concat([limitAsNumber, offsetAsNumber]);

  const result = await query(q, combinedValues);

  return {
    limit: limitAsNumber,
    offset: offsetAsNumber,
    items: result.rows,
  };
}

/**
 * Framkvæmir uppfærslu á gagnagrunn ef hún er lögleg
 *
 * @param {*} table table til að uppfæra
 * @param {*} id id á hlut sem er verið að uppfæra
 * @param {*} fields upplýsingar sem á að breyta
 * @param {*} values gildi sem á að nota fyrir breytingum
 * @returns niðurstaða úr færslu
 */
async function conditionalUpdate(table, id, fields, values) {
  const filteredFields = fields.filter((i) => typeof i === 'string');
  const filteredValues = values.filter(
    (i) => typeof i === 'string' || typeof i === 'number' || i instanceof Date,
  );

  if (filteredFields.length === 0) {
    return false;
  }

  if (filteredFields.length !== filteredValues.length) {
    throw new Error('fields and values must be of equal length');
  }

  const updates = filteredFields.map((field, i) => `${field} = $${i + 2}`);

  const q = `
    UPDATE ${table}
      SET ${updates.join(', ')}
    WHERE
      id = $1
    RETURNING *
    `;

  const queryValues = [id].concat(filteredValues);

  debug('Conditional update', q, queryValues);

  const result = await query(q, queryValues);

  return result;
}

export { query, conditionalUpdate, pagedQuery };
