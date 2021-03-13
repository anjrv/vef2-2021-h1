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
    const [{ id, name }] = r.rows;

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
    series.airDate || null,
    genre,
    series.inProduction || null,
    series.tagline || null,
    series.image,
    series.description || null,
    series.language || null,
    series.network || null,
    series.homepage || null,
  ];

  return query(q, values);
}

async function importSeasons(seasons) {
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
    seasons.poster,
    seasons.serieId,
  ];

  return query(q, values);
}

async function importEpisodes(episodes) {
  const q = `
  INSERT INTO
    episodes
    (name, number, airDate, overview, season, serie)
  VALUES
    ($1, $2, $3, $4, $5, $6)`;

  const values = [
    episodes.name,
    episodes.number,
    episodes.airDate || null,
    episodes.overview || null,
    episodes.season,
    episodes.serieId,
  ];

  return query(q, values);
}

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

export async function importData() {
  console.info('Starting import');

  const series = await getData('./data/series.csv');
  const genres = await importGenres(series);

  for (let i = 0; i < series.length; i += 1) {
    await importSeries(series[i], genres);
    console.info(`Imported ${series[i].name}`);
  }

  console.info('Series imported');

  const seasons = await getData('./data/seasons.csv');

  for (let i = 0; i < seasons.length; i += 1) {
    await importSeasons(seasons[i]);
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
