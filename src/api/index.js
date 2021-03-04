import express from 'express';
import catchErrors from '../utils/catchErrors.js';
import { requireAuth, checkUserIsAdmin } from '../authentication/auth.js';
import { seriesRoute } from './series.js';
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
    tv: {
      series: '/tv',
    },
  });
}

router.get('/', indexRoute);

router.get('/users', requireAdmin, catchErrors(listUsers));
router.get('/users/me', requireAuth, catchErrors(currentUser));
router.patch('/users/me', requireAuth, catchErrors(updateCurrentUser));
router.get('/users/:id', requireAdmin, catchErrors(listUser));
router.patch('/users/:id', requireAdmin, catchErrors(updateUser));
router.get('/tv', catchErrors(seriesRoute));

export { router };
