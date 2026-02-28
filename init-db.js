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
                image_data TEXT, 
                user_id INTEGER REFERENCES users(id)
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS interactions (
                id SERIAL PRIMARY KEY, 
                user_id INTEGER REFERENCES users(id), 
                photo_id INTEGER REFERENCES photos(id), 
                type VARCHAR(10), 
                UNIQUE(user_id, photo_id)
            );
        `);

        console.log("Siker! A táblák készen állnak.");
        process.exit(0);
    } catch (err) {
        console.error("Hiba történt:", err);
        process.exit(1);
    }
};

init();
