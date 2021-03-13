import express from 'express';
import catchErrors from '../utils/catchErrors.js';
import { requireAuth, checkUserIsAdmin } from '../authentication/auth.js';
import {
  seriesRoute,
  seriesById,
  seriesPostRoute,
  seriesPatchRoute,
  seriesDeleteRoute,
  genresRoute,
  genresPostRoute,
} from './series.js';
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
      serie: '/tv/{id}',
    },
    genres: '/genres',
  });
}

router.get('/', indexRoute);

router.get('/users', requireAdmin, catchErrors(listUsers));
router.get('/users/me', requireAuth, catchErrors(currentUser));
router.patch('/users/me', requireAuth, catchErrors(updateCurrentUser));
router.get('/users/:id', requireAdmin, catchErrors(listUser));
router.patch('/users/:id', requireAdmin, catchErrors(updateUser));
router.get('/tv', catchErrors(seriesRoute));
router.post('/tv', requireAdmin, catchErrors(seriesPostRoute));
router.get('tv/:id', catchErrors(seriesById));
router.patch('tv/:id', requireAdmin, catchErrors(seriesPatchRoute));
router.delete('tv/:id', requireAdmin, catchErrors(seriesDeleteRoute));
router.get('/genres', catchErrors(genresRoute));
router.post('/genres', requireAdmin, catchErrors(genresPostRoute));

export { router };
