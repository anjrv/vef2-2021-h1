/* eslint-disable no-await-in-loop */
import csv from 'csv-parser';
import fs from 'fs';
import { query } from './db.js';

// TODO: genres

async function importSeries(series) {
  const q = `
  INSERT INTO
    series
    (id, name, airDate, inProduction, tagline, image, description, language, network, homepage)
  VALUES
    ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`;

  const values = [
    series.id,
    series.name,
    series.airDate,
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

  fs.createReadStream('./data/episodes.csv')
    .pipe(csv())
    .on('data', (data) => episodes.push(data));

  fs.createReadStream('./data/seasons.csv')
    .pipe(csv())
    .on('data', (data) => seasons.push(data));

  fs.createReadStream('./data/series.csv')
    .pipe(csv())
    .on('data', (data) => series.push(data))
    .on('end', () => {
      for (let i = 0; i < series.length; i += 1) {
        importSeries(series[i]);
        console.info(`Imported ${series[i].name}`);
      }
    });

  console.info('finished!');
}

importData().catch((err) => {
  console.error('Error importing', err);
});
