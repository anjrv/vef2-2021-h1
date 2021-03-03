import pkg from 'pg';

const { Client } = pkg;
const connectionString = process.env.DATABASE_URL;

export async function query(sqlQuery, values = []) {
  const client = new Client({ connectionString });
  await client.connect();

  let result;

  try {
    result = await client.query(sqlQuery, values);
  } finally {
    await client.end();
  }

  return result;
}
