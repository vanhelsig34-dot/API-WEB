/**
 * DracoTech Reparaciones - Backend Setup
 */
const express = require('express');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const promClient = require('prom-client');
const bcrypt = require('bcrypt');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const xss = require('xss-clean');
const hpp = require('hpp');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const app = express();
const port = 3000;

// Set up Prometheus metrics
const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics({ register: promClient.register });

const httpRequestCounter = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// Middleware for JSON and static files
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Security middlewares
app.use(helmet());
app.use(cors());
app.use(xss()); // Prevent XSS attacks
app.use(hpp()); // Prevent HTTP Parameter Pollution

// Rate limiters for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 10, // Limit each IP to 10 requests per window
    message: { success: false, message: 'Demasiadas peticiones desde esta IP, por favor intenta en 15 minutos' },
    standardHeaders: 'draft-7',
    legacyHeaders: false,
});

// Middleware for tracking HTTP requests
app.use((req, res, next) => {
    res.on('finish', () => {
        httpRequestCounter.inc({
            method: req.method,
            route: req.route ? req.route.path : req.path,
            status_code: res.statusCode
        });
    });
    next();
});

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
        const userData = JSON.parse(fs.readFileSync(path.join(__dirname, '../database/user_data.json'), 'utf8'));
        
        for (const user of userData.users) {
            const hashedPassword = await bcrypt.hash(user.password, 10);
            await pool.query(`
                INSERT INTO users (username, password, full_name, role)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (username) DO NOTHING;
            `, [user.username, hashedPassword, user.fullName, user.role]);
        }
        console.log('Seeded users from JSON.');
        console.log('------------------------');
    } catch (err) {
        console.error('Error seeding database:', err.message);
        console.log('Note: Ensure Docker container is running (docker-compose up -d)');
    }
}

// Login API endpoint
app.post('/login', [
    authLimiter,
    body('username').trim().isAlphanumeric().withMessage('El usuario debe ser alfanumérico').escape(),
    body('password').notEmpty().withMessage('La contraseña es obligatoria').escape()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Entrada inválida', errors: errors.array() });
    }

    const { username, password } = req.body;

    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );

        if (result.rows.length > 0) {
            const user = result.rows[0];
            const match = await bcrypt.compare(password, user.password);
            
            if (match) {
                // Generate JWT
                const token = jwt.sign(
                    { id: user.id, username: user.username, role: user.role }, 
                    process.env.JWT_SECRET || 'fallback_secret', 
                    { expiresIn: '8h' }
                );

                res.json({ 
                    success: true, 
                    user: user.username, 
                    fullName: user.full_name,
                    role: user.role,
                    token: token
                });
            } else {
                res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos' });
            }
        } else {
            res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos' });
        }
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Register API endpoint
app.post('/register', [
    authLimiter,
    body('username').trim().isAlphanumeric().withMessage('El usuario debe ser alfanumérico').escape(),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres').escape(),
    body('fullName').trim().notEmpty().withMessage('El nombre completo es obligatorio').escape()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
    }

    const { username, password, fullName } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        // Default role for new users is 'Usuario'
        const result = await pool.query(
            'INSERT INTO users (username, password, full_name, role) VALUES ($1, $2, $3, $4) RETURNING username',
            [username, hashedPassword, fullName, 'Usuario']
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

// Metrics API endpoint for Prometheus
app.get('/metrics', async (req, res) => {
    try {
        res.set('Content-Type', promClient.register.contentType);
        res.end(await promClient.register.metrics());
    } catch (err) {
        res.status(500).end(err);
    }
});

// Start server immediately
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    // Initialize database in background
    seedDatabase();
});
