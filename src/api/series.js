import xss from 'xss';
import { pagedQuery, query, conditionalUpdate } from '../db.js';

import addPageMetadata from '../utils/addPageMetadata.js';
import { isInt } from '../utils/validation.js';

// TODO: Validation for post and patch
// TODO: Seasons og Episodes

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
  genresRoute,
  genresPostRoute,
  seriesRoute,
  seriesPostRoute,
  seriesById,
  seriesPatchRoute,
  seriesDeleteRoute,
};
