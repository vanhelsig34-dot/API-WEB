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
app.use(express.static(path.join(__dirname, '../frontend')));

// DB connection pool (using environment variables from docker-compose)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    connectionTimeoutMillis: 5000 // 5 seconds timeout
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
        // Ensure role column exists if table was created before
        await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT;');
        console.log('Checked users table and role column.');

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

// Register API endpoint
app.post('/register', async (req, res) => {
    const { username, password, fullName } = req.body;

    if (!username || !password || !fullName) {
        return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios' });
    }

    try {
        // Default role for new users is 'Usuario'
        const result = await pool.query(
            'INSERT INTO users (username, password, full_name, role) VALUES ($1, $2, $3, $4) RETURNING username',
            [username, password, fullName, 'Usuario']
        );

        res.json({ 
            success: true, 
            message: 'Cuenta creada exitosamente',
            user: result.rows[0].username 
        });
    } catch (err) {
        if (err.code === '23505') { // Unique constraint violation
            return res.status(409).json({ success: false, message: 'El nombre de usuario ya existe' });
        }
        console.error('Registration error:', err);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

// Start server immediately
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    // Initialize database in background
    seedDatabase();
});
