const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:password@localhost:5432/postgres'
});

async function createDb() {
  await client.connect();
  try {
    await client.query('CREATE DATABASE "ucdb-gestao-emprestimo"');
    console.log('Database "ucdb-gestao-emprestimo" created successfully.');
  } catch (e) {
    console.error('Error creating database:', e.message);
  } finally {
    await client.end();
  }
}

createDb();
