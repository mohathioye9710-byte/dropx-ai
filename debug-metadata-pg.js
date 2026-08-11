require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL || 'postgresql://dropx_user:dropx_password@localhost:5433/dropx_db?schema=public' });
  await client.connect();
  const res = await client.query('SELECT metadata FROM "Activity" WHERE type=$1 ORDER BY "createdAt" DESC LIMIT 2', ['PRODUCT_GENERATE']);
  
  for (let row of res.rows) {
    if (typeof row.metadata === 'string') {
        try {
            console.log(JSON.stringify(JSON.parse(row.metadata), null, 2));
        } catch(e) {
            console.log(row.metadata);
        }
    } else {
        console.log(JSON.stringify(row.metadata, null, 2));
    }
  }
  await client.end();
}
run().catch(console.error);
