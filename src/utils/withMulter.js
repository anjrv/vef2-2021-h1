import multer from 'multer';

/**
 * Middleware sem leyfir okkur að taka við myndum
 *
 * @param {object} req req hlutur
 * @param {object} res res hlutur
 * @param {function} next næsta middleware sem á að nota
 * @param {function} fn næsta fall sem á að fara í
 */
export default async function withMulter(req, res, next, fn) {
  multer({ dest: './temp' }).single('image')(req, res, (err) => {
    if (err) {
      if (err.message === 'Unexpected field') {
        const errors = [
          {
            field: 'image',
            error: 'Unable to read image',
          },
        ];
        return res.status(400).json({ errors });
      }

      return next(err);
    }

    return fn(req, res, next).catch(next);
  });
}
