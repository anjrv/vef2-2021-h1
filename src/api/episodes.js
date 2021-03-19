import xss from 'xss';

import { query } from '../db.js';
import { isInt, validateEpisode } from '../utils/validation.js';

/**
 * Route til að búa til nýjan þátt (episode)
 * @param {*} req request hlutur
 * @param {*} res response hlutur
 */
async function episodesPostRoute(req, res) {
  const { id, number } = req.params;

  if ((!isInt(id)) || (!isInt(number))) {
    return null;
  }

  const validationMessage = await validateEpisode(req.body);

  if (validationMessage && validationMessage.length > 0) {
    return res.status(400).json({ errors: validationMessage });
  }

  const seasonId = await query('SELECT id FROM seasons WHERE serie = $1 AND number = $2', [id, number]);

  const q = `
  INSERT INTO episodes
    (name, number, airDate, overview, season, serie, seasonId)
  VALUES
    ($1, $2, $3, $4, $5, $6, $7)
  RETURNING *
  `;

  const data = [
    xss(req.body.name),
    xss(req.body.number),
    xss(req.body.airDate) || null,
    xss(req.body.overview) || null,
    number,
    id,
    seasonId.rows[0].id,
  ];

  const result = await query(q, data);

  return res.status(201).json(result.rows[0]);
}

/**
 * Skilar upplýsingum um þátt fyrir gefið serie, season og id
 * @param {*} req request hlutur
 * @param {*} res reponse hlutur
 * @returns json af upplýsingum um þátt (episode)
 */
async function episodeRoute(req, res) {
  const { id, number, episode } = req.params;

  const episodes = await query(
    'SELECT * FROM episodes WHERE serie = $1 AND season = $2 AND number = $3',
    [id, number, episode],
  );

  return res.json(episodes.rows[0]);
}

/**
 * Eyðir stökum þætti (episode)
 * @param {*} req request hlutur
 * @param {*} res response hlutur
 */
async function episodeDeleteRoute(req, res) {
  const { id, number, episode } = req.params;

  if (!isInt(id)) {
    return null;
  }

  const del = await query(
    'DELETE FROM episodes WHERE serie = $1 AND season = $2 AND number = $3',
    [id, number, episode],
  );

  if (del.rowCount === 1) {
    return res.status(204).json({});
  }

  return res.status(404).json({ error: 'Episode not found' });
}

export {
  episodeRoute,
  episodesPostRoute,
  episodeDeleteRoute,
};
