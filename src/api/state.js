import xss from 'xss';

import { conditionalUpdate, query } from '../db.js';
import { isInt } from '../utils/validation.js';

/**
 * Skráir einkunn innskráðs notanda á sjónvarpsþátt
 * @param {*} req request hlutur
 * @param {*} res response hlutur
 */
async function ratingPostRoute(req, res) {
  const { id } = req.params;
  const userId = req.user.id;

  const q = `
  INSERT INTO users_series
    ("user", serie, rating)
  VALUES
    ($1, $2, $3)
  RETURNING *
    `;

  const data = [
    userId,
    id,
    xss(req.body.rating),
  ];

  const result = await query(q, data);

  return res.status(201).json(result.rows[0]);
}

/**
 * Uppfærir einkunn innskráðs notanda á sjónvarpsþætti
 * @param {*} req request hlutur
 * @param {*} res response hlutur
 */
async function ratingPatchRoute(req, res) {
  const { id } = req.params;
  const userId = req.user.id;

  const ratingId = await query('SELECT id FROM users_series WHERE "user" = $1', [userId]);

  const isset = (f) => typeof f === 'string' || typeof f === 'number';

  const fields = [
    isset(id) ? 'serie' : null,
    isset(req.body.rating) ? 'rating' : null,
  ];

  const values = [
    isset(id) ? xss(id) : null,
    isset(req.body.rating) ? xss(req.body.rating) : null,
  ];

  const result = await conditionalUpdate('users_series', ratingId.rows[0].id, fields, values);

  if (!result) {
    return res.status(400).json({ error: 'Nothing to patch' });
  }

  return res.status(201).json(result.rows[0]);
}

/**
 * Eyðir einkunn innskráðs notanda á sjónvarpsþætti
 * @param {*} req request hlutur
 * @param {*} res response hlutur
 */
async function deleteRating(req, res) {
  const { id: ratedId } = req.params;
  const userId = req.user.id;

  if (userId === null) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (!isInt(ratedId)) {
    return res.status(404).json({ error: 'Rated entry not found' });
  }

  const del = await query('DELETE FROM users_series WHERE id = $1', [ratedId]);

  if (del.rowCount === 1) {
    return res.status(204).json({});
  }

  return res.status(404).json({ error: 'Rated entry not found' });
}

/**
 * Skráir stöðu innskráðs notanda á sjónvarpsþætti
 * @param {*} req request hlutur
 * @param {*} res response hlutur
 */
async function statePostRoute(req, res) {
  const { id } = req.params;
  const userId = req.user.id;

  const q = `
  INSERT INTO users_series
    ("user", serie, state)
  VALUES
    ($1, $2, $3)
  RETURNING *
    `;

  const data = [
    userId,
    id,
    xss(req.body.state),
  ];

  const result = await query(q, data);

  return res.status(201).json(result.rows[0]);
}

/**
 * Uppfærir stöðu innskráðs notanda á sjónvarpsþætti
 * @param {*} req request hlutur
 * @param {*} res response hlutur
 */
async function statePatchRoute(req, res) {
  const { id } = req.params;
  const userId = req.user.id;

  const stateId = await query('SELECT id FROM users_series WHERE "user" = $1', [userId]);

  const isset = (f) => typeof f === 'string' || typeof f === 'number';

  const fields = [
    isset(id) ? 'serie' : null,
    isset(req.body.state) ? 'state' : null,
  ];

  const values = [
    isset(id) ? xss(id) : null,
    isset(req.body.state) ? xss(req.body.state) : null,
  ];

  const result = await conditionalUpdate('users_series', stateId.rows[0].id, fields, values);

  if (!result) {
    return res.status(400).json({ error: 'Nothing to patch' });
  }

  return res.status(201).json(result.rows[0]);
}

/**
 * Eyðir stöðu innskráðs notanda á sjónvarpsþætti
 * @param {*} req request hlutur
 * @param {*} res response hlutur
 */
async function deleteState(req, res) {
  const { id: watchedId } = req.params;

  const userId = req.user.id;

  if (userId === null) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (!isInt(watchedId)) {
    return res.status(404).json({ error: 'Watched entry not found' });
  }

  const del = await query('DELETE FROM users_series WHERE id = $1', [watchedId]);

  if (del.rowCount === 1) {
    return res.status(204).json({});
  }

  return res.status(404).json({ error: 'Watched entry not found' });
}

export {
  ratingPostRoute,
  ratingPatchRoute,
  deleteRating,
  statePostRoute,
  statePatchRoute,
  deleteState,
};
