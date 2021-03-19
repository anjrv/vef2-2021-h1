/* eslint-disable no-await-in-loop */
import csv from 'csv-parser';
import fs from 'fs';
import { query } from './db.js';

/**
 * Býr til genre flokkar
 *
 * @param {object} rows raðir til að vinna úr
 * @returns samsettar genre flokkar
 */
async function importGenres(genre) {
  const q = `
  INSERT INTO
    genres
    (name)
  VALUES
    ($1)`;

  const values = [genre];

  return query(q, values);
}

/**
 * Setur genre inn í gagnagrunn
 *
 * @param {object} values gildi til að nota við innsetningu
 * @returns köll á query fyrir insert
 */
async function importSerieGenre(values) {
  const q = `
  INSERT INTO
    serie_genre
    (serie, genre)
  VALUES
    ($1, $2)`;

  return query(q, values);
}

/**
 * Setur seríu inn í gagnagrunn
 *
 * @param {object} series sería til að setja inn
 * @param {object} genres set af genres
 * @param {object} images fylki af Cloudinary myndum
 * @returns köll á query fyrir insert
 */
async function importSeries(series, images, genres) {
  const q = `
  INSERT INTO
    series
    (id, name, airDate, inProduction, tagline, image, description, language, network, url)
  VALUES
    ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`;

  const values = [
    series.id,
    series.name,
    series.airDate || null,
    series.inProduction || null,
    series.tagline || '',
    images.get(series.image),
    series.description || null,
    series.language || null,
    series.network || null,
    series.homepage || null,
  ];

  await query(q, values);

  const g = series.genres.split(',');
  let vals;
  for (let i = 0; i < g.length; i += 1) {
    vals = [series.id, genres.indexOf(g[i]) + 1];
    await importSerieGenre(vals);
  }
}

/**
 * Setur season inn í gagnagrunn
 *
 * @param {object} seasons season úr seríu
 * @param {object} images fylki af Cloudinary myndum
 * @returns köll á query fyrir insert
 */
async function importSeasons(seasons, images) {
  const q = `
  INSERT INTO
    seasons
    (name, number, airDate, overview, poster, serie)
  VALUES
    ($1, $2, $3, $4, $5, $6)`;

  const values = [
    seasons.name,
    seasons.number,
    seasons.airDate || null,
    seasons.overview || null,
    images.get(seasons.poster),
    seasons.serieId,
  ];

  return query(q, values);
}

/**
 * Setur sjónvarpsþátt inn í gagnagrunn
 *
 * @param {object} episodes sjónvarsþátt
 * @returns köll á query fyrir insert
 */
async function importEpisodes(episodes) {
  const episodeSeason = await query(
    'SELECT id FROM seasons WHERE serie = $1 AND number = $2',
    [episodes.serieId, episodes.season],
  );

  const q = `
  INSERT INTO
    episodes
    (name, number, airDate, overview, season, serie, seasonId)
  VALUES
    ($1, $2, $3, $4, $5, $6, $7)`;

  const values = [
    episodes.name,
    episodes.number,
    episodes.airDate || null,
    episodes.overview || null,
    episodes.season,
    episodes.serieId,
    episodeSeason.rows[0].id,
  ];

  return query(q, values);
}

/**
 * Hjálparfall fyrir gagnamöndl
 *
 * @param {object} file path á csv skrá
 * @returns fylki sett saman úr upplýsingum úr csv skrá
 */
function getData(file) {
  const data = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(file)
      .pipe(csv())
      .on('error', (error) => {
        reject(error);
      })
      .on('data', (item) => data.push(item))
      .on('end', () => {
        resolve(data);
      });
  });
}

/**
 * Býr til gögn úr csv og setur í gagnagrunn
 *
 * @param {object} images fylki af myndum á Cloudinary
 */
export async function importData(images) {
  console.info('Starting import');

  // Byrjum með seríur út af foreign key constraint
  const series = await getData('./data/series.csv');
  const genres = new Set();

  for (let i = 0; i < series.length; i += 1) {
    const g = series[i].genres.split(',');
    for (let j = 0; j < g.length; j += 1) {
      genres.add(g[j]);
    }
  }

  const gnrs = Array.from(genres);
  gnrs.forEach(async (genre) => {
    await importGenres(genre);
  });

  console.info('Genres imported');

  for (let i = 0; i < series.length; i += 1) {
    await importSeries(series[i], images, gnrs);
    console.info(`Imported ${series[i].name}`);
  }

  console.info('Series imported');

  const seasons = await getData('./data/seasons.csv');

  for (let i = 0; i < seasons.length; i += 1) {
    await importSeasons(seasons[i], images);
    console.info(`Imported ${seasons[i].name}`);
  }

  console.info('Seasons imported');

  const episodes = await getData('./data/episodes.csv');

  for (let i = 0; i < episodes.length; i += 1) {
    await importEpisodes(episodes[i]);
    console.info(`Imported ${episodes[i].name}`);
  }

  console.info('Episodes imported');
  console.info('Finished!');
}
