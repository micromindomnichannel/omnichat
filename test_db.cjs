const { Client } = require('pg');

async function testConnection() {
  console.log('Connecting to PostgreSQL database "omnichannel" at 148.251.171.147:5432...');

  // First try connecting directly to 'omnichannel' database
  let client = new Client({
    host: '148.251.171.147',
    port: 5432,
    user: 'postgres',
    password: 'admin',
    database: 'omnichannel',
    connectionTimeoutMillis: 10000
  });

  try {
    await client.connect();
    console.log('✅ Successfully connected to database "omnichannel"!');
    
    const dbInfo = await client.query('SELECT current_database(), current_user, version()');
    console.log('Database Info:', dbInfo.rows[0]);

    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Public Tables in "omnichannel":', tables.rows.map(r => r.table_name));

    await client.end();
  } catch (err) {
    console.error('❌ Failed to connect to "omnichannel" database:', err.message);
    
    // Try connecting to default 'postgres' database to check available databases
    console.log('\nTesting connection to default "postgres" database...');
    const fallbackClient = new Client({
      host: '148.251.171.147',
      port: 5432,
      user: 'postgres',
      password: 'admin',
      database: 'postgres',
      connectionTimeoutMillis: 10000
    });

    try {
      await fallbackClient.connect();
      console.log('✅ Connected to "postgres" database!');
      const dbs = await fallbackClient.query('SELECT datname FROM pg_database WHERE datistemplate = false');
      console.log('Available Databases on Server:', dbs.rows.map(r => r.datname));
      await fallbackClient.end();
    } catch (fbErr) {
      console.error('❌ Connection to postgres database also failed:', fbErr.message);
    }
  }
}

testConnection();
