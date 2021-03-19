import xss from 'xss';

import { findSerieGenresById } from './genres.js';
import { pagedQuery, query, conditionalUpdate } from '../db.js';
import {
  isInt,
  validateSeries,
  validateMimetype,
  toPositiveNumberOrDefault,
  MIMETYPES,
} from '../utils/validation.js';
import { uploadImageIfNotUploaded } from '../images.js';
import addPageMetadata from '../utils/addPageMetadata.js';
import withMulter from '../utils/withMulter.js';

/**
 * Hjálparfall sem skilar sjónvarpsþætti fyrir id
 * @param {*} id id sjónvarpsþáttar
 * @returns sjónvarpsþáttur
 */
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
  `,
    [id],
  );

  if (series.rows.length !== 1) {
    return null;
  }

  return series.rows[0];
}

/**
 * Skilar fylki af öllum sjónvarpsþáttum
 * @param {*} req request hlutur
 * @param {*} res response hlutur
 * @returns json af sjónvarpsþáttaupplýsingum
 */
async function seriesRoute(req, res) {
  const { offset = 0, limit = 10 } = req.query;

  const q = `
    SELECT
      series.*
    FROM
      series
    ORDER BY id ASC
    `;

  const series = await pagedQuery(q, [], { offset, limit });

  const seriesWithPage = addPageMetadata(series, req.path, {
    offset,
    limit,
    length: series.items.length,
  });

  return res.json(seriesWithPage);
}

async function seriesPostRouteWithImage(req, res, next) {
  const validationMessage = await validateSeries(req.body);

  const { file: { path, mimetype } = {} } = req;
  const hasImage = Boolean(path && mimetype);
  let image = null;

  if (hasImage) {
    if (!validateMimetype(mimetype)) {
      validationMessage.push({
        field: 'image',
        error: `Mimetype ${mimetype} is not legal. `
        + `Only ${MIMETYPES.join(', ')} are accepted`,
      });
    }
  }

  if (validationMessage.length > 0) {
    return res.status(400).json({ errors: validationMessage });
  }

  if (hasImage) {
    let upload = null;
    try {
      upload = uploadImageIfNotUploaded(path);
    } catch (error) {
      if (error.http_code && error.http_code === 400) {
        return res.status(400).json({
          errors: [
            {
              field: 'image',
              error: error.message,
            },
          ],
        });
      }

      console.error('Unable to upload file to cloudinary');
      return next(error);
    }

    if (upload && upload.secure_url) {
      image = upload;
    } else {
      return next(new Error('Cloudinary upload missing secure_url'));
    }
  }

  const q = `
    INSERT INTO series
      (name, airDate, inProduction, tagline, image, description, language, network, url)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9 )
    RETURNING *
    `;

  const data = [
    xss(req.body.name),
    xss(req.body.airDate),
    xss(req.body.inProduction),
    xss(req.body.tagline),
    xss(image),
    xss(req.body.description),
    xss(req.body.language),
    xss(req.body.network),
    xss(req.body.url),
  ];

  const result = await query(q, data);

  return res.status(201).json(result.rows[0]);
}

/**
 * Route til að búa til nýjan sjónvarpsþátt
 * @param {*} req request hlutur
 * @param {*} res response hlutur
 */
async function seriesPostRoute(req, res, next) {
  return withMulter(req, res, next, seriesPostRouteWithImage);
}

/**
 * Skilar upplýsingum um stakan sjónvarpsþátt fyrir gefið id
 * @param {*} req request hlutur
 * @param {*} res response hlutur
 * @returns json af upplýsingum um sjónvarpsþátt
 */
async function seriesById(req, res) {
  const { id } = req.params;

  const series = await findById(id);

  if (!series) {
    return res.status(404).json({ error: 'Series not found' });
  }

  const serieGenres = await findSerieGenresById(series.id);
  series.genres = serieGenres;

  const serieSeasons = await query(
    'SELECT * FROM seasons WHERE serie = $1 ORDER BY number ASC',
    [id],
  );

  series.seasons = serieSeasons.rows;

  return res.json(series);
}

async function seriesPatchRouteWithImage(req, res, next) {
  const { id } = req.params;

  if (!isInt(id)) {
    return null;
  }

  const series = await findById(id);

  if (!series) {
    return res.status(404).json({ error: 'Series not found' });
  }

  const validationMessage = await validateSeries(req.body, true);

  const { file: { path, mimetype } = {} } = req;
  const hasImage = Boolean(path && mimetype);
  let image = null;

  if (hasImage) {
    if (!validateMimetype(mimetype)) {
      validationMessage.push({
        field: 'image',
        error: `Mimetype ${mimetype} is not legal. `
        + `Only ${MIMETYPES.join(', ')} are accepted`,
      });
    }
  }

  if (validationMessage.length > 0) {
    return res.status(400).json({ errors: validationMessage });
  }

  const isset = (f) => typeof f === 'string' || typeof f === 'number';

  if (hasImage) {
    let upload = null;
    try {
      upload = uploadImageIfNotUploaded(path);
    } catch (error) {
      if (error.http_code && error.http_code === 400) {
        return res.status(400).json({
          errors: [
            {
              field: 'image',
              error: error.message,
            },
          ],
        });
      }

      console.error('Unable to upload file to cloudinary');
      return next(error);
    }

    if (upload && upload.secure_url) {
      image = upload;
    } else {
      return next(new Error('Cloudinary upload missing secure_url'));
    }
  }

  const fields = [
    isset(req.body.name) ? 'name' : null,
    isset(req.body.airdate) ? 'airDate' : null,
    isset(req.body.inProduction) ? 'inProduction' : null,
    isset(req.body.tagline) ? 'tagline' : null,
    isset(req.body.image) ? 'image' : null,
    isset(req.body.description) ? 'description' : null,
    isset(req.body.language) ? 'language' : null,
    isset(req.body.network) ? 'network' : null,
    isset(req.body.url) ? 'url' : null,
  ];

  const values = [
    isset(req.body.name) ? xss(req.body.name) : null,
    isset(req.body.airdate) ? xss(req.body.airDate) : null,
    isset(req.body.inProduction) ? xss(req.body.inProduction) : null,
    isset(req.body.tagline) ? xss(req.body.tagline) : null,
    isset(req.body.image) ? xss(image) : null,
    isset(req.body.description) ? xss(req.body.description) : null,
    isset(req.body.language) ? xss(req.body.language) : null,
    isset(req.body.network) ? xss(req.body.network) : null,
    isset(req.body.url) ? xss(req.body.url) : null,
  ];

  const result = await conditionalUpdate('series', id, fields, values);

  if (!result) {
    return res.status(400).json({ error: 'Nothing to patch' });
  }

  return res.status(201).json(result.rows[0]);
}

/**
 * Route til að uppfæra upplýsingar um sjónvarpsþátt fyrir id
 * @param {*} req request hlutur
 * @param {*} res response hlutur
 */
async function seriesPatchRoute(req, res, next) {
  return withMulter(req, res, next, seriesPatchRouteWithImage);
}

/**
 * Eyðir sjónvarpsþætti með gefið id
 * @param {*} req request hlutur
 * @param {*} res response hlutur
 */
async function seriesDeleteRoute(req, res) {
  const { id } = req.params;

  if (!isInt(id)) {
    return null;
  }

  const series = await findById(id);

  if (!series) {
    return res.status(404).json({ error: 'Series not found' });
  }

  const countQuery = 'SELECT COUNT(*) FROM seasons WHERE serie = $1';
  const countResult = await query(countQuery, [id]);
  const { count } = countResult.rows[0];

  if (toPositiveNumberOrDefault(count, 0) > 0) {
    return res.status(400).json({ error: 'Serie is not empty' });
  }

  await query('DELETE FROM serie_genre WHERE serie = $1', [id]);
  await query('DELETE FROM series WHERE id = $1', [id]);

  return res.status(204).json({});
}

export {
  seriesRoute,
  seriesPostRoute,
  seriesById,
  seriesPatchRoute,
  seriesDeleteRoute,
};
