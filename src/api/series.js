import xss from 'xss';
import { pagedQuery, query, conditionalUpdate } from '../db.js';

import addPageMetadata from '../utils/addPageMetadata.js';
import { isInt } from '../utils/validation.js';

// TODO: Validation
// TODO: Klára Episodes
// TODO: Bæta við genres, seasons ofl fyrir tv id GET
// TODO: Prófa betur post, delete, patch
// TODO: Skjala og refactor

async function seasonsRoute(req, res) {
  const { offset = 0, limit = 10 } = req.query;
  const { id } = req.params;

  const seasons = await pagedQuery('SELECT * FROM seasons WHERE serie = $1 ORDER BY number ASC', [id], { offset, limit });

  return res.json(seasons);
}

async function seasonsPostRoute(req, res) {
  // TODO: Validation og ath hvort season sé nú þegar til?
  // TODO: Prófa
  const { id } = req.params;

  if (!Number.isInteger(Number(id))) {
    return res.status(404).json({ error: 'Series not found' });
  }

  const q = `
  INSERT INTO seasons
    (name, number, airDate, overview, poster, serie)
  VALUES
    ($1, $2, $3, $4, $5, $6)
  RETURNING *
  `;

  const data = [
    xss(req.body.name),
    xss(req.body.number),
    xss(req.body.airDate),
    xss(req.body.overview),
    xss(req.body.poster),
    id, // er þetta að virka?
  ];

  const result = await query(q, data);

  return res.status(201).json(result.rows[0]);
}

async function seasonById(req, res) {
  // TODO: á líka að skila fylki af þáttum
  const { id, number } = req.params;

  const season = await query('SELECT * FROM seasons WHERE serie = $1 AND number = $2', [id, number]);

  return res.json(season.rows[0]);
}

async function seasonDeleteRoute(req, res) {
  // TODO: Prófa
  const { id, number } = req.params;

  if (!Number.isInteger(Number(id))) {
    return res.status(404).json({ error: 'Series not found' });
  }

  const del = await query('DELETE FROM seasons WHERE serie = $1 AND number = $2', [id, number]);

  if (del.rowCount === 1) {
    return res.status(204).json({});
  }

  return res.status(404).json({ error: 'Season not found' });
}

async function episodesPostRoute(req, res) {
  // TODO: Validation
  // TODO: Prófa
  const { id, number } = req.params;

  const q = `
  INSERT INTO episodes
    (name, number, airDate, overview, season, serie)
  VALUES
    ($1, $2, $3, $4, $5, $6)
  RETURNING *
  `;

  const data = [
    xss(req.body.name),
    xss(req.body.number),
    xss(req.body.airDate),
    xss(req.body.overview),
    number,
    id,
  ];

  const result = await query(q, data);

  return res.status(201).json(result.rows[0]);
}

async function episodeRoute(req, res) {
  const { id, number, episode } = req.params;

  const episodes = await query('SELECT * FROM episodes WHERE serie = $1 AND season = $2 AND number = $3', [id, number, episode]);

  return res.json(episodes.rows[0]);
}

async function episodeDeleteRoute(req, res) {
  // TODO: Prófa
  const { id, number, episode } = req.params;

  if (!Number.isInteger(Number(id))) {
    return res.status(404).json({ error: 'Series not found' });
  }

  const del = await query('DELETE FROM episodes WHERE serie = $1 AND season = $2 AND number = $3', [id, number, episode]);

  if (del.rowCount === 1) {
    return res.status(204).json({});
  }

  return res.status(404).json({ error: 'Episode not found' });
}

async function genresRoute(req, res) {
  const { offset = 0, limit = 10 } = req.query;

  const genres = await pagedQuery('SELECT * FROM genres', [], { offset, limit });

  return res.json(genres);
}

async function findById(id) {
  if (!isInt(id)) {
    return null;
  }

  const series = await query(
    `SELECT
      series.*
    FROM
      series
    WHERE id = $1
  `, [id],
  );

  if (series.rows.length !== 1) {
    return null;
  }

  return series.rows[0];
}

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

async function seriesRoute(req, res) {
  const { offset = 0, limit = 10 } = req.query;

  const q = `
    SELECT
      series.*
    FROM
      series
    ORDER BY name ASC
    `;

  const series = await pagedQuery(q, [], { offset, limit });

  const seriesWithPage = addPageMetadata(series, req.path, {
    offset,
    limit,
    length: series.items.length,
  });

  return res.json(seriesWithPage);
}

async function seriesPostRoute(req, res) {
  // TODO: validation

  const q = `
    INSERT INTO series
      (name, airDate, inProduction, tagline, image, description, language, network, homepage)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9 )
    RETURNING *
    `;

  const data = [
    xss(req.body.name),
    xss(req.body.airDate),
    xss(req.body.inProduction),
    xss(req.body.tagline),
    xss(req.body.image),
    xss(req.body.description),
    xss(req.body.language),
    xss(req.body.network),
    xss(req.body.homepage),
  ];

  const result = await query(q, data);

  return res.status(201).json(result.rows[0]);
}

// TODO:
// Þarf líka meðal einkunn sjónvarpsþáttar,
// fjölda einkunna sem hafa verið skráðar fyrir sjónvarpsþátt,
// fylki af tegundum sjónvarpsþáttar (genres),
// fylki af seasons,
// rating notanda, (ef notandi)
// staða notanda (ef notandi)
async function seriesById(req, res) {
  const { id } = req.params;

  const series = await findById(id);

  if (!series) {
    return res.status(404).json({ error: 'Series not found' });
  }

  return res.json(series);
}

async function seriesPatchRoute(req, res) {
  // TODO: Validation
  const { id } = req.params;

  if (!Number.isInteger(Number(id))) {
    return res.status(404).json({ error: 'Series not found' });
  }

  const series = await findById(id);

  if (!series) {
    return res.status(404).json({ error: 'Series not found' });
  }

  const isset = (f) => typeof f === 'string' || typeof f === 'number';

  const fields = [
    isset(req.body.name) ? 'name' : null,
    isset(req.body.airdate) ? 'airDate' : null,
    isset(req.body.inProduction) ? 'inProduction' : null,
    isset(req.body.tagline) ? 'tagline' : null,
    isset(req.body.image) ? 'image' : null,
    isset(req.body.description) ? 'description' : null,
    isset(req.body.language) ? 'language' : null,
    isset(req.body.network) ? 'network' : null,
    isset(req.body.homepage) ? 'homepage' : null,
  ];

  const values = [
    isset(req.body.name) ? xss(req.body.name) : null,
    isset(req.body.airdate) ? xss(req.body.airDate) : null,
    isset(req.body.inProduction) ? xss(req.body.inProduction) : null,
    isset(req.body.tagline) ? xss(req.body.tagline) : null,
    isset(req.body.image) ? xss(req.body.image) : null,
    isset(req.body.description) ? xss(req.body.description) : null,
    isset(req.body.language) ? xss(req.body.language) : null,
    isset(req.body.network) ? xss(req.body.network) : null,
    isset(req.body.homepage) ? xss(req.body.homepage) : null,
  ];

  const result = await conditionalUpdate('series', id, fields, values);

  if (!result) {
    return res.status(400).json({ error: 'Nothing to patch' });
  }

  return res.status(201).json(result.rows[0]);
}

async function seriesDeleteRoute(req, res) {
  const { id } = req.params;

  if (!Number.isInteger(Number(id))) {
    return res.status(404).json({ error: 'Series not found' });
  }

  const series = await findById(id);

  if (!series) {
    return res.status(404).json({ error: 'Series not found' });
  }

  const del = await query('DELETE FROM series WHERE id = $1', [id]);

  if (del.rowCount === 1) {
    return res.status(204).json({});
  }

  return res.status(404).json({ error: 'Series not found' });
}

export {
  seasonsRoute,
  seasonsPostRoute,
  seasonDeleteRoute,
  seasonById,
  episodeRoute,
  episodesPostRoute,
  episodeDeleteRoute,
  genresRoute,
  genresPostRoute,
  seriesRoute,
  seriesPostRoute,
  seriesById,
  seriesPatchRoute,
  seriesDeleteRoute,
};
