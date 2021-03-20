import xss from 'xss';

import { conditionalUpdate, query } from '../db.js';
import { isInt, validateState, STATES } from '../utils/validation.js';

/**
 * Skráir einkunn innskráðs notanda á sjónvarpsþátt
 * @param {object} req request hlutur
 * @param {object} res response hlutur
 */
async function ratingPostRoute(req, res) {
  const { id } = req.params;
  const { rating } = req.body;
  const userId = req.user.id;

  const info = await query(
    'SELECT * FROM users_series WHERE serie = $1 AND "user" = $2',
    [id, userId],
  );

  if (rating && isInt(rating)) {
    let q = null;
    if (info.rows[0] && !info.rows[0].rating) {
      q = `
    UPDATE 
      users_series
    SET
      rating = $3
    WHERE 
      serie = $2 AND "user" = $1
    RETURNING *
    `;
    } else if (!info.rows[0]) {
      q = `
  INSERT INTO users_series
    ("user", serie, rating)
  VALUES
    ($1, $2, $3)
  RETURNING *
    `;
    }

    if (q) {
      const data = [userId, id, xss(req.body.rating)];
      const result = await query(q, data);

      return res.status(201).json(result.rows[0]);
    }

    return res.status(400).json({
      error: [
        {
          field: 'rating',
        },
        {
          error: 'rating already exists',
        },
      ],
    });
  }
  return res.status(400).json({
    error: [
      {
        field: 'rating',
      },
      {
        error: 'no valid rating to post',
      },
    ],
  });
}

/**
 * Uppfærir einkunn innskráðs notanda á sjónvarpsþætti
 *
 * @param {object} req request hlutur
 * @param {object} res response hlutur
 */
async function ratingPatchRoute(req, res) {
  const { id } = req.params;
  const userId = req.user.id;

  const ratingId = await query(
    'SELECT id FROM users_series WHERE "user" = $1',
    [userId],
  );

  const isset = (f) => typeof f === 'string' || typeof f === 'number';

  const fields = [
    isset(id) ? 'serie' : null,
    isset(req.body.rating) ? 'rating' : null,
  ];

  const values = [
    isset(id) ? xss(id) : null,
    isset(req.body.rating) ? xss(req.body.rating) : null,
  ];

  const result = await conditionalUpdate(
    'users_series',
    ratingId.rows[0].id,
    fields,
    values,
  );

  if (!result) {
    return res.status(400).json({ error: 'Nothing to patch' });
  }

  return res.status(201).json(result.rows[0]);
}

/**
 * Eyðir einkunn innskráðs notanda á sjónvarpsþætti
 *
 * @param {object} req request hlutur
 * @param {object} res response hlutur
 */
async function deleteRating(req, res) {
  const { id: ratedId } = req.params;
  const userId = req.user.id;

  if (!isInt(ratedId)) {
    return res.status(404).json({ error: 'Rated entry not found' });
  }

  const info = await query(
    'SELECT * FROM users_series WHERE serie = $1 AND "user" = $2',
    [ratedId, userId],
  );

  let result = null;

  if (info.rows[0] && info.rows[0].state) {
    result = await query(
      `
    UPDATE 
      users_series
    SET
      rating = NULL
    WHERE 
      serie = $1 AND "user" = $2
    RETURNING *
    `,
      [ratedId, userId],
    );
  } else {
    result = await query(
      'DELETE FROM users_series WHERE serie = $1 AND "user" = $2',
      [ratedId, userId],
    );
  }

  if (result.rowCount === 1) {
    return res.status(204).json({});
  }

  return res.status(404).json({ error: 'Rated entry not found' });
}

/**
 * Skráir stöðu innskráðs notanda á sjónvarpsþætti
 *
 * @param {object} req request hlutur
 * @param {object} res response hlutur
 */
async function statePostRoute(req, res) {
  const { id } = req.params;
  const { state } = req.body;
  const userId = req.user.id;

  if (state) {
    if (!validateState(state)) {
      return res.status(400).json({
        error: [
          {
            field: 'state',
          },
          {
            error:
              `State ${state} is not legal. `
              + `Only ${STATES.join(', ')} are accepted`,
          },
        ],
      });
    }
  } else {
    return res.status(400).json({
      error: [
        {
          field: 'state',
        },
        {
          error: 'state is required',
        },
      ],
    });
  }

  const info = await query(
    'SELECT * FROM users_series WHERE serie = $1 AND "user" = $2',
    [id, userId],
  );

  let q = null;
  if (info.rows[0] && !info.rows[0].state) {
    q = `
    UPDATE 
      users_series
    SET
      state = $3
    WHERE 
      serie = $2 AND "user" = $1
    RETURNING *
    `;
  } else if (!info.rows[0]) {
    q = `
      INSERT INTO users_series
      ("user", serie, state)
    VALUES
      ($1, $2, $3)
    RETURNING *
    `;
  }

  if (q) {
    const data = [userId, id, xss(req.body.state)];
    const result = await query(q, data);

    return res.status(201).json(result.rows[0]);
  }

  return res.status(400).json({
    error: [
      {
        field: 'state',
      },
      {
        error: 'state already exists',
      },
    ],
  });
}

/**
 * Uppfærir stöðu innskráðs notanda á sjónvarpsþætti
 *
 * @param {*} req request hlutur
 * @param {*} res response hlutur
 */
async function statePatchRoute(req, res) {
  const { id } = req.params;
  const { state } = req.body;
  const userId = req.user.id;

  if (state) {
    if (!validateState(state)) {
      return res.status(400).json({
        error: [
          {
            field: 'state',
          },
          {
            error:
              `State ${state} is not legal. `
              + `Only ${STATES.join(', ')} are accepted`,
          },
        ],
      });
    }
  } else {
    return res.status(400).json({
      error: [
        {
          field: 'state',
        },
        {
          error: 'no state to patch',
        },
      ],
    });
  }

  const stateId = await query(
    'SELECT id FROM users_series WHERE serie = $1 AND "user" = $2',
    [id, userId],
  );

  const isset = (f) => typeof f === 'string' || typeof f === 'number';

  const fields = [
    isset(id) ? 'serie' : null,
    isset(req.body.state) ? 'state' : null,
  ];

  const values = [
    isset(id) ? xss(id) : null,
    isset(req.body.state) ? xss(req.body.state) : null,
  ];

  const result = await conditionalUpdate(
    'users_series',
    stateId.rows[0].id,
    fields,
    values,
  );

  if (!result) {
    return res.status(400).json({ error: 'Nothing to patch' });
  }

  return res.status(201).json(result.rows[0]);
}

/**
 * Eyðir stöðu innskráðs notanda á sjónvarpsþætti
 *
 * @param {object} req request hlutur
 * @param {object} res response hlutur
 */
async function deleteState(req, res) {
  const { id: watchedId } = req.params;
  const userId = req.user.id;

  if (!isInt(watchedId)) {
    return res.status(404).json({ error: 'Watched entry not found' });
  }

  const info = await query(
    'SELECT * FROM users_series WHERE serie = $1 AND "user" = $2',
    [watchedId, userId],
  );

  let result = null;

  if (info.rows[0] && info.rows[0].rate) {
    result = await query(
      `
    UPDATE 
      users_series
    SET
      state = NULL
    WHERE 
      serie = $1 AND "user" = $2
    RETURNING *
    `,
      [watchedId, userId],
    );
  } else {
    result = await query(
      'DELETE FROM users_series WHERE serie = $1 AND "user" = $2',
      [watchedId, userId],
    );
  }

  if (result.rowCount === 1) {
    return res.status(204).json({});
  }

  return res.status(404).json({ error: 'Entry not found' });
}

export {
  ratingPostRoute,
  ratingPatchRoute,
  deleteRating,
  statePostRoute,
  statePatchRoute,
  deleteState,
};
