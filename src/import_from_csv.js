/* eslint-disable no-await-in-loop */
import csv from 'csv-parser';
import fs from 'fs';
import { query } from './db.js';

// TODO: Láta fara inn í töflur, það er ekki að gerast núna,
// hugsanlega þarf ég að klára að útfæra app.js osfrv.
// TODO: Require í stað import
// TODO: importSeasons og importEpisodes föll

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
      // eslint-disable-next-line no-console
      console.log(series); // for testing purposes, delete later
    });

  for (let i = 0; i < series.length; i += 1) {
    await importSeries(series[i]);
    console.info(`Imported ${series[i].name}`);
  }
  console.info('finished!');
}

importData().catch((err) => {
  console.error('Error importing', err);
});
