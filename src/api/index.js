import express from 'express';

import catchErrors from '../utils/catchErrors.js';
import { requireAuth, checkAuth, checkUserIsAdmin } from '../authentication/auth.js';
import {
  seriesRoute,
  seriesById,
  seriesPostRoute,
  seriesPatchRoute,
  seriesDeleteRoute,
} from './series.js';
import {
  seasonsRoute,
  seasonsPostRoute,
  seasonDeleteRoute,
  seasonById,
} from './seasons.js';
import {
  episodesPostRoute,
  episodeRoute,
  episodeDeleteRoute,
} from './episodes.js';
import {
  genresRoute,
  genresPostRoute,
} from './genres.js';
import {
  ratingPostRoute,
  ratingPatchRoute,
  deleteRating,
  statePostRoute,
  statePatchRoute,
  deleteState,
} from './state.js';
import {
  listUsers,
  listUser,
  updateUserRoute as updateUser,
  currentUserRoute as currentUser,
  updateCurrentUser,
} from './users.js';

const requireAdmin = [requireAuth, checkUserIsAdmin];

const router = express.Router();

function indexRoute(_req, res) {
  return res.json({
    tv: {
      series: {
        href: '/tv',
        methods: ['GET', 'POST'],
      },
      serie: {
        href: '/tv/{id}',
        methods: ['GET', 'PATCH', 'DELETE'],
      },
      rate: {
        href: '/tv/{id}/rate',
        methods: ['POST', 'PATCH', 'DELETE'],
      },
      state: {
        href: '/tv/{id}/state',
        methods: ['POST', 'PATCH', 'DELETE'],
      },
    },
    seasons: {
      seasons: {
        href: '/tv/{id}/season/',
        methods: ['GET', 'POST'],
      },
      season: {
        href: '/tv/{id}/season/{number}',
        methods: ['GET', 'DELETE'],
      },
    },
    episodes: {
      episodes: {
        href: '/tv/{id}/season/{number}/episode/',
        methods: ['POST'],
      },
      episode: {
        href: '/tv/{id}/season/{number}/episode/{episode}',
        methods: ['GET', 'DELETE'],
      },
    },
    genres: {
      genres: {
        href: '/genres',
        methods: ['GET', 'POST'],
      },
    },
    users: {
      users: {
        href: '/users',
        methods: ['GET'],
      },
      user: {
        href: '/users/{id}',
        methods: ['GET', 'PATCH'],
      },
      register: {
        href: '/users/register',
        methods: ['POST'],
      },
      login: {
        href: '/users/login',
        methods: ['POST'],
      },
      me: {
        href: '/users/me',
        methods: ['GET', 'PATCH'],
      },
    },
  });
}

router.get('/', indexRoute);

router.get('/tv', catchErrors(seriesRoute));
router.post('/tv', requireAdmin, catchErrors(seriesPostRoute));
router.get('/tv/:id', checkAuth, catchErrors(seriesById));
router.patch('/tv/:id', requireAdmin, catchErrors(seriesPatchRoute));
router.delete('/tv/:id', requireAdmin, catchErrors(seriesDeleteRoute));
router.get('/tv/:id/season/', catchErrors(seasonsRoute));
router.post('/tv/:id/season/', requireAdmin, catchErrors(seasonsPostRoute));
router.get('/tv/:id/season/:number', catchErrors(seasonById));
router.delete('/tv/:id/season/:number', requireAdmin, catchErrors(seasonDeleteRoute));
router.post('/tv/:id/season/:number/episode/', requireAdmin, catchErrors(episodesPostRoute));
router.get('/tv/:id/season/:number/episode/:episode', catchErrors(episodeRoute));
router.delete('/tv/:id/season/:number/episode/:episode', requireAdmin, catchErrors(episodeDeleteRoute));

router.post('/tv/:id/rate', requireAuth, catchErrors(ratingPostRoute));
router.patch('/tv/:id/rate', requireAuth, catchErrors(ratingPatchRoute));
router.delete('/tv/:id/rate', requireAuth, catchErrors(deleteRating));
router.post('/tv/:id/state', requireAuth, catchErrors(statePostRoute));
router.patch('/tv/:id/state', requireAuth, catchErrors(statePatchRoute));
router.delete('/tv/:id/state', requireAuth, catchErrors(deleteState));

router.get('/genres', catchErrors(genresRoute));
router.post('/genres', requireAdmin, catchErrors(genresPostRoute));

router.get('/users', requireAdmin, catchErrors(listUsers));
router.get('/users/me', requireAuth, catchErrors(currentUser));
router.patch('/users/me', requireAuth, catchErrors(updateCurrentUser));
router.get('/users/:id', requireAdmin, catchErrors(listUser));
router.patch('/users/:id', requireAdmin, catchErrors(updateUser));

export { router };
