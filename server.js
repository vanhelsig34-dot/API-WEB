/**
 * DracoTech Reparaciones - Backend Setup
 */
const express = require('express');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const port = 3000;

// Middleware for JSON and static files
app.use(express.json());
app.use(express.static(__dirname));

// DB connection pool (using environment variables from docker-compose)
const pool = new Pool({
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'password123',
  host: process.env.DB_HOST || 'db', // The name of the db service in docker-compose
  database: process.env.DB_NAME || 'techapi_db',
  port: parseInt(process.env.DB_PORT || '5432'),
});

// Seed the database on startup
async function seedDatabase() {
    try {
        console.log('--- Database Seeding ---');
        
        // Wait for Postgres (simple delay)
        await new Promise(r => setTimeout(r, 2000));

        // Create table with role
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                full_name TEXT,
                role TEXT
            );
        `);
        console.log('Checked users table existence.');

        // Load users from JSON
        const userData = JSON.parse(fs.readFileSync(path.join(__dirname, 'user_data.json'), 'utf8'));
        
        for (const user of userData.users) {
            await pool.query(`
                INSERT INTO users (username, password, full_name, role)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (username) DO NOTHING;
            `, [user.username, user.password, user.fullName, user.role]);
        }
        console.log('Seeded users from JSON.');
        console.log('------------------------');
    } catch (err) {
        console.error('Error seeding database:', err.message);
        console.log('Note: Ensure Docker container is running (docker-compose up -d)');
    }
}

seedDatabase();

// Login API endpoint
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1 AND password = $2',
            [username, password]
        );

        if (result.rows.length > 0) {
            const user = result.rows[0];
            res.json({ 
                success: true, 
                user: user.username, 
                fullName: user.full_name,
                role: user.role 
            });
        } else {
            res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos' });
        }
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
