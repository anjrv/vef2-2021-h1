import express from 'express';
import catchErrors from '../utils/catchErrors.js';
import { requireAuth, checkUserIsAdmin } from '../authentication/auth.js';
import {
  seasonsRoute,
  seasonsPostRoute,
  seasonById,
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
    tv: {
      series: '/tv',
      serie: '/tv/{id}',
    },
    genres: '/genres',
    seasons: {
      seasons: '/tv/{id}/season/',
      season: '/tv/{id}/season/{number}',
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
router.post('/tv', requireAdmin, catchErrors(seriesPostRoute));
router.get('/tv/:id', catchErrors(seriesById));
router.patch('/tv/:id', requireAdmin, catchErrors(seriesPatchRoute));
router.delete('/tv/:id', requireAdmin, catchErrors(seriesDeleteRoute));
router.get('/tv/:id/season/', catchErrors(seasonsRoute));
router.post('/tv/:id/season/', requireAdmin, catchErrors(seasonsPostRoute));
router.get('/tv/:id/season/:number', catchErrors(seasonById));

router.get('/genres', catchErrors(genresRoute));
router.post('/genres', requireAdmin, catchErrors(genresPostRoute));

export { router };
