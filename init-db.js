const { Pool } = require('pg');
const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL, 
    ssl: { rejectUnauthorized: false } 
});

const init = async () => {
    try {
        console.log("Táblák létrehozása folyamatban...");
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY, 
                username VARCHAR(50) UNIQUE, 
                password TEXT
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS photos (
                id SERIAL PRIMARY KEY, 
                name VARCHAR(40), 
                upload_date TIMESTAMP DEFAULT NOW(), 
                image_url TEXT,
                image_public_id TEXT,
                user_id INTEGER REFERENCES users(id)
            );
        `);

        await pool.query('ALTER TABLE photos ADD COLUMN IF NOT EXISTS image_url TEXT;');
        await pool.query('ALTER TABLE photos ADD COLUMN IF NOT EXISTS image_public_id TEXT;');
        await pool.query('DELETE FROM photos WHERE image_url IS NULL;');
        await pool.query('ALTER TABLE photos DROP COLUMN IF EXISTS image_data;');

        console.log("Siker! A táblák készen állnak.");
        process.exit(0);
    } catch (err) {
        console.error("Hiba történt:", err);
        process.exit(1);
    }
};

init();
