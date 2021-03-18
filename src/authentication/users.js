import bcrypt from 'bcrypt';
import xss from 'xss';

import { query, conditionalUpdate } from '../db.js';
import {
  isInt,
  isEmpty,
  isNotEmptyString,
  isString,
  toPositiveNumberOrDefault,
  lengthValidationError,
} from '../utils/validation.js';

// Sjálfgefið 11 umferðir
const { BCRYPT_ROUNDS: bcryptRounds = 11 } = process.env;

/**
 * @param {String} username notandanafn
 * @returns upplýsingar um notanda
 */
async function findByUsername(username) {
  const q = `
    SELECT
      *
    FROM
      users
    WHERE username = $1`;

  const result = await query(q, [username]);

  if (result.rowCount === 1) {
    return result.rows[0];
  }

  return null;
}

/**
 * @param {String} email netfang
 * @returns upplýsingar um notanda
 */
async function findByEmail(email) {
  const q = `
    SELECT
      *
    FROM
      users
    WHERE email = $1`;

  const result = await query(q, [email]);

  if (result.rowCount === 1) {
    return result.rows[0];
  }

  return null;
}

/**
 * @param {object} param0 notandanafn, lykilorð og tölvupóst
 * @param {boolean} patching hvort verið er að patcha
 * @param {int} id id á notanda
 * @returns niðurstaða
 */
async function validateUser(
  { username, password, email } = {},
  patching = false,
  id = null,
) {
  const validations = [];

  // Getum ekki patchað notandanafn
  if (!patching) {
    if (!isNotEmptyString(username, { min: 3, max: 32 })) {
      validations.push({
        field: 'username',
        error: lengthValidationError(username, 3, 32),
      });
    }

    const user = await findByUsername(username);

    if (user) {
      validations.push({
        field: 'username',
        error: 'Username exists',
      });
    }
  }

  if (!patching || password || isEmpty(password)) {
    if (!isNotEmptyString(password, { min: 8 })) {
      validations.push({
        field: 'password',
        error: lengthValidationError(password, 8),
      });
    }
  }

  if (!patching || email || isEmpty(email)) {
    if (!isNotEmptyString(email, { min: 1, max: 64 })) {
      validations.push({
        field: 'email',
        error: lengthValidationError(1, 64),
      });
    }

    const user = await findByEmail(email);

    if (user) {
      const current = user.id;

      if (patching && id && current === toPositiveNumberOrDefault(id, 0)) {
        // Getum patchað okkur tölvupóst
      } else {
        validations.push({
          field: 'email',
          error: 'Email exists',
        });
      }
    }
  }

  return validations;
}

/**
 * Hjálparfall til að skoða hvort lykilorð sé rétt
 *
 * @param {String} password lykilorð sem sleginn var inn
 * @param {String} hash hash upplýsingar
 * @returns niðurstaða úr samanburði
 */
async function comparePasswords(password, hash) {
  const result = await bcrypt.compare(password, hash);

  return result;
}

async function findById(id) {
  if (!isInt(id)) {
    return null;
  }

  const user = await query(
    `SELECT
      *
    FROM
      users
    WHERE id = $1`,
    [id],
  );

  if (user.rows.length !== 1) {
    return null;
  }

  return user.rows[0];
}

/**
 * Bætir notanda við users töflu
 *
 * @param {String} username notandanafn
 * @param {String} password lykilorð
 * @param {String} email tölvupóst
 * @param {boolean} admin hvort notandi á að vera admin (default = false)
 * @returns niðurstaða á uppfærslu
 */
async function createUser(username, password, email, admin = false) {
  const hashedPassword = await bcrypt.hash(password, bcryptRounds);

  const q = `
    INSERT INTO
      users (username, email, password)
    VALUES
      ($1, $2, $3)
    RETURNING *`;

  const values = [xss(username), xss(email), hashedPassword, admin];
  const result = await query(q, values);

  return result.rows[0];
}

/**
 * Framkvæmir uppfærslu á upplýsingum á notanda
 *
 * @param {int} id id gildi á notanda sem uppfæra á
 * @param {String} password lykilorð hjá notanda
 * @param {String} email email hjá notanda
 * @returns niðurstaða á uppfærslu
 */
async function updateUser(id, password, email) {
  if (!isInt(id)) {
    return null;
  }

  const fields = [
    isString(password) ? 'password' : null,
    isString(email) ? 'email' : null,
  ];

  let hashedPassword = null;

  if (password) {
    hashedPassword = await bcrypt.hash(password, bcryptRounds);
  }

  const values = [hashedPassword, isString(email) ? xss(email) : null];

  const result = await conditionalUpdate('users', id, fields, values);

  if (!result) {
    return null;
  }

  const updatedUser = result.rows[0];
  delete updatedUser.password;

  return updatedUser;
}

export {
  validateUser,
  comparePasswords,
  findByUsername,
  findById,
  createUser,
  updateUser,
};
