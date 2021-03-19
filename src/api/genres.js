import xss from 'xss';

import { pagedQuery, query } from '../db.js';
import { isInt } from '../utils/validation.js';

/**
 * Hjálparfall sem finnur flokka sjónvarpsþáttar fyrir id
 * @param {*} serieID id sjónvarpsþáttar
 * @returns flokkar
 */
async function findSerieGenresById(serieID) {
  if (!isInt(serieID)) {
    return null;
  }

  const serieGenres = await query(
    `SELECT
      genre
    FROM
      serie_genre
    WHERE serie = $1
  `,
    [serieID],
  );

  const genres = await query('SELECT * FROM genres');
  const values = [];

  serieGenres.rows.forEach((id) => {
    genres.rows.forEach((row) => {
      if (row.id === id.genre) {
        values.push(row);
      }
    });
  });

  return values;
}

/**
 * Skilar fylki af flokkum með paging
 * @param {*} req request hlutur
 * @param {*} res response hlutur
 * @returns json af upplýsingum um flokka
 */
async function genresRoute(req, res) {
  const { offset = 0, limit = 10 } = req.query;

  const genres = await pagedQuery('SELECT * FROM genres', [], {
    offset,
    limit,
  });

  return res.json(genres);
}

/**
 * Route til að búa til nýjan flokk (genre)
 * @param {*} req request hlutur
 * @param {*} res response hlutur
 */
async function genresPostRoute(req, res) {
  const { name } = req.body;

  if (typeof name !== 'string' || name.length === 0 || name.length > 255) {
    const message = 'Name is required, must not be empty or longer than 255 characters';
    return res.status(400).json({
      errors: [{ field: 'name', message }],
    });
  }

  const cat = await query('SELECT * FROM genres WHERE name = $1', [name]);

  if (cat.rows.length > 0) {
    return res.status(400).json({
      errors: [{ field: 'name', message: 'Genre already exists' }],
    });
  }

  const q = 'INSERT INTO genres (name) VALUES ($1) RETURNING*';
  const result = await query(q, [xss(name)]);

  return res.status(201).json(result.rows[0]);
}

export {
  genresRoute,
  genresPostRoute,
  findSerieGenresById,
};
