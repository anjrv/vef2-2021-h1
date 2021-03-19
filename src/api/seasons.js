import xss from 'xss';

import { pagedQuery, query } from '../db.js';
import {
  isInt,
  validateSeason,
  validateMimetype,
  toPositiveNumberOrDefault,
  MIMETYPES,
} from '../utils/validation.js';
import withMulter from '../utils/withMulter.js';
import { uploadImageIfNotUploaded } from '../images.js';

/**
 * Skilar fylki af seasons fyrir sjónvarpsþátt með paging
 * @param {*} req request hlutur
 * @param {*} res response hlutur
 * @returns json af seasons
 */
async function seasonsRoute(req, res) {
  const { offset = 0, limit = 10 } = req.query;
  const { id } = req.params;

  const seasons = await pagedQuery(
    'SELECT * FROM seasons WHERE serie = $1 ORDER BY number ASC',
    [id],
    { offset, limit },
  );

  return res.json(seasons);
}

async function seasonsPostRouteWithImage(req, res, next) {
  const { id } = req.params;

  if (!isInt(id)) {
    return null;
  }

  const validationMessage = await validateSeason(req.body);

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
    xss(image),
    id,
  ];

  const result = await query(q, data);

  return res.status(201).json(result.rows[0]);
}

/**
 * Route til að búa til nýtt season fyrir sjónvarpsþátt
 * @param {*} req request hlutur
 * @param {*} res response hlutur
 */
async function seasonsPostRoute(req, res, next) {
  return withMulter(req, res, next, seasonsPostRouteWithImage);
}

/**
 * Skilar upplýsingum um stakt season fyrir gefið id og serie
 * @param {*} req request hlutur
 * @param {*} res response hlutur
 * @returns json af upplýsingum um sjónvarpsþátt
 */
async function seasonById(req, res) {
  const { id, number } = req.params;

  const season = await query(
    'SELECT * FROM seasons WHERE serie = $1 AND number = $2',
    [id, number],
  );

  const episodes = await query(
    'SELECT * FROM episodes WHERE serie = $1 AND season = $2 ORDER BY number ASC',
    [id, number],
  );
  season.rows[0].episodes = episodes.rows;

  return res.json(season.rows[0]);
}

/**
 * Eyðir season úr sjónvarpsþætti (series)
 * @param {*} req request hlutur
 * @param {*} res response hlutur
 */
async function seasonDeleteRoute(req, res) {
  const { id, number } = req.params;

  if (!isInt(id)) {
    return null;
  }

  const countQuery = 'SELECT COUNT(*) FROM episodes WHERE serie = $1 AND season = $2';
  const countResult = await query(countQuery, [id, number]);
  const { count } = countResult.rows[0];

  if (toPositiveNumberOrDefault(count, 0) > 0) {
    return res.status(400).json({ error: 'Season is not empty' });
  }

  const del = await query(
    'DELETE FROM seasons WHERE serie = $1 AND number = $2',
    [id, number],
  );

  if (del.rowCount === 1) {
    return res.status(204).json({});
  }

  return res.status(404).json({ error: 'Season not found' });
}

export {
  seasonsRoute, seasonsPostRoute, seasonDeleteRoute, seasonById,
};
