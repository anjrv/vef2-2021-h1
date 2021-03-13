/* eslint-disable no-await-in-loop */
import csv from 'csv-parser';
import fs from 'fs';
import { query } from './db.js';

// TODO: genres

async function importGenres(rows) {
  const genres = [];

  // Finna einstaka flokka
  rows.forEach((row) => {
    if (genres.indexOf(row.genres) < 0) {
      genres.push(row.genres);
    }
  });

  // breyta hverjum einstökum flokk í insert fyrir þann flokk
  const q = 'INSERT INTO genres (name) VALUES ($1) RETURNING *';
  const inserts = genres.map((c) => query(q, [c]));

  // inserta öllu og bíða
  const results = await Promise.all(inserts);

  const mapped = {};

  // skila á forminu { NAFN: id, .. } svo að það sé auðvelt að fletta upp
  results.forEach((r) => {
    const [{
      id,
      name,
    }] = r.rows;

    mapped[name] = id;
  });

  return mapped;
}

async function importSeries(series, genres) {
  const q = `
  INSERT INTO
    series
    (id, name, airDate, genres, inProduction, tagline, image, description, language, network, homepage)
  VALUES
    ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`;

  const genre = genres[series.genres];

  const values = [
    series.id,
    series.name,
    series.airDate,
    genre,
    series.inProduction,
    series.tagline,
    series.image,
    series.description,
    series.language,
    series.network,
    series.homepage,
  ];

  return query(q, values);
}

async function importSeasons(seasons) {
  const q = `
  INSERT INTO
    seasons
    (id, name, number, airDate, overview, poster, serie)
  VALUES
    ($1, $2, $3, $4, $5, $6, $7)`;

  const values = [
    seasons.id,
    seasons.name,
    seasons.number,
    seasons.airDate,
    seasons.overview,
    seasons.poster,
    seasons.serie,
  ];

  return query(q, values);
}

async function importEpisodes(episodes) {
  const q = `
  INSERT INTO
    episodes
    (id, name, number, airDate, overview, season, serie)
  VALUES
    ($1, $2, $3, $4, $5, $6, $7)`;

  const values = [
    episodes.id,
    episodes.name,
    episodes.number,
    episodes.airDate,
    episodes.overview,
    episodes.season,
    episodes.serie,
  ];

  return query(q, values);
}

async function importData() {
  const episodes = [];
  const seasons = [];
  const series = [];

  console.info('Starting import');

  fs.createReadStream('../data/episodes.csv')
    .pipe(csv())
    .on('data', (data) => episodes.push(data))
    .on('end', () => {
      for (let i = 0; i < episodes.length; i += 1) {
        importEpisodes(episodes[i]);
        console.info(`Imported ${episodes[i].name}`);
      }
    });

  fs.createReadStream('../data/seasons.csv')
    .pipe(csv())
    .on('data', (data) => seasons.push(data))
    .on('end', () => {
      for (let i = 0; i < seasons.length; i += 1) {
        importSeasons(series[i]);
        console.info(`Imported ${seasons[i].name}`);
      }
    });

  fs.createReadStream('../data/series.csv')
    .pipe(csv())
    .on('data', (data) => series.push(data))
    .on('end', () => {
      const genres = importGenres(series);
      for (let i = 0; i < series.length; i += 1) {
        importSeries(series[i], genres);
        console.info(`Imported ${series[i].name}`);
      }
    });

  console.info('finished!');
}

importData().catch((err) => {
  console.error('Error importing', err);
});
