import { pagedQuery } from '../db.js';

import addPageMetadata from '../utils/addPageMetadata.js';

// TODO:
// /tv post
// /tv/:id

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

export {
  seriesRoute,
};
