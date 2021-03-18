import xss from 'xss';

import { query } from '../db.js';

// Bíða aðeins með þetta - Ath JOIN fyrir rate/state í tv/:id
// /tv/:id/rate
// POST, skráir einkunn innskráðs notanda á sjónvarpsþætti, aðeins fyrir innskráða notendur

async function ratingPostRoute(req, res) {
  const { id } = req.params;
  const { userId } = req.user;

  const q = `
  INSERT INTO users_series
    ("user", series, rating)
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

// TODO: PATCH, uppfærir einkunn innskráðs notanda á sjónvarpsþætti
async function ratingPatchRoute(req, res) {

}

// DELETE, eyðir einkunn innskráðs notanda á sjónvarpsþætti
async function deleteRating(req, res) {

}

// /tv/:id/state
// POST, skráir stöðu innskráðs notanda á sjónvarpsþætti, aðeins fyrir innskráða notendur
// PATCH, uppfærir stöðu innskráðs notanda á sjónvarpsþætti
// DELETE, eyðir stöðu innskráðs notanda á sjónvarpsþætti

export {
  ratingPostRoute,
};
