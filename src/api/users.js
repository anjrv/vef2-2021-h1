import { validateUser, updateUser, findById } from '../authentication/users.js';
import { query, pagedQuery } from '../db.js';
import { isBoolean } from '../utils/validation.js';
import addPageMetadata from '../utils/addPageMetadata.js';

/**
 * Skilar fylki af notendum með paging
 *
 * @param {object} req req hlutur
 * @param {object} res res hlutur
 * @returns json of notenda upplýsingum
 */
async function listUsers(req, res) {
  const { offset = 0, limit = 10 } = req.query;

  const users = await pagedQuery(
    `SELECT
        id, username, email, admin
      FROM
        users
      ORDER BY id ASC`,
    [],
    { offset, limit },
  );

  const usersWithPage = addPageMetadata(users, req.path, {
    offset,
    limit,
    length: users.items.length,
  });

  return res.json(usersWithPage);
}

/**
 * Skilar notendaupplýsingum fyrir id úr req
 *
 * @param {object} req req hlutur
 * @param {object} res res hlutur
 * @returns json upplýsingar um notanda
 */
async function listUser(req, res) {
  const { id } = req.params;

  const user = await findById(id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  return res.json(user);
}

/**
 * Route til að uppfæra upplýsingar um núverandi notanda eftir id
 *
 * @param {*} req req hlutur
 * @param {*} res res hlutur
 * @returns
 */
async function updateUserRoute(req, res) {
  const { id } = req.params;
  const { user: currentUser } = req;
  const { admin } = req.body;

  const user = await findById(id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (!isBoolean(admin)) {
    return res.status(400).json({
      errors: [
        {
          field: 'admin',
          error: 'Must be a boolean',
        },
      ],
    });
  }

  if (!admin && currentUser.id === Number(id)) {
    return res.status(400).json({
      error: 'Can not remove admin privileges from self',
    });
  }

  const q = `
      UPDATE
        users
      SET admin = $1,
      WHERE id = $2
      RETURNING
        id, username, email, admin`;
  const result = await query(q, [Boolean(admin), id]);

  return res.status(201).json(result.rows[0]);
}

/**
 * Upplýsingar um núveranda notenda
 *
 * @param {object} req req hlutur
 * @param {object} res res hlutur
 * @returns json upplýsingar
 */
async function currentUserRoute(req, res) {
  const { user: { id } = {} } = req;

  const user = await findById(id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  return res.json(user);
}

/**
 * Uppfærir upplýsingar um notanda eftir id
 *
 * @param {object} req req hlutur
 * @param {object} res res hlutur
 * @returns
 */
async function updateCurrentUser(req, res) {
  const { id } = req.user;

  const user = await findById(id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { password, email } = req.body;

  const validationMessage = await validateUser({ password, email }, true, id);

  if (validationMessage && validationMessage.length > 0) {
    return res.status(400).json({ errors: validationMessage });
  }

  const result = await updateUser(id, password, email);

  if (!result) {
    return res.status(400).json({ error: 'Nothing to update' });
  }

  return res.status(200).json(result);
}

export {
  listUsers,
  listUser,
  updateUserRoute,
  currentUserRoute,
  updateCurrentUser,
};
