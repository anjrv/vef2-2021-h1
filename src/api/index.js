import express from 'express';
import catchErrors from '../utils/catchErrors.js';
import { requireAuth, checkUserIsAdmin } from '../authentication/auth.js';
import {
  listUsers,
  listUser,
  updateUserRoute as updateUser,
  currentUserRoute as currentUser,
  updateCurrentUser,
} from './users.js';

const requireAdmin = [
  requireAuth,
  checkUserIsAdmin,
];

const router = express.Router();

function indexRoute(req, res) {
  return res.json({
    users: {
      users: '/users',
      user: '/users/{id}',
      register: '/users/register',
      login: '/users/login',
      me: '/users/me',
    },
    // TODO:
    // Bæta við routes fyrir series, seasons, episodes, genres, ...
  });
}

router.get('/', indexRoute);

router.get('/users', requireAdmin, catchErrors(listUsers));
router.get('/users/me', requireAuth, catchErrors(currentUser));
router.patch('/users/me', requireAuth, catchErrors(updateCurrentUser));
router.get('/users/:id', requireAdmin, catchErrors(listUser));
router.patch('/users/:id', requireAdmin, catchErrors(updateUser));

export { router };
