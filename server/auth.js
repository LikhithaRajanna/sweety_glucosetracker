const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('./db');
const jwt = require('jsonwebtoken');

const router = express.Router();

// User registration
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check whether all fields are provided
        if (!name || !email || !password) {
            return res.status(400).json({
                message: 'Name, email and password are required'
            });
        }

        const trimmedName = name.trim();
        const trimmedEmail = email.trim().toLowerCase();

        if (!trimmedName || !trimmedEmail || password.length < 8) {
            return res.status(400).json({
                message: 'Enter a valid name, email and password of at least 8 characters'
            });
        }

        // Check email format
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(trimmedEmail)) {
            return res.status(400).json({
                message: 'Please enter a valid email address'
            });
        }

        // Hash the password before saving it
        const hashedPassword = await bcrypt.hash(password, 10);

        // Save the user in PostgreSQL
        const result = await pool.query(
            `INSERT INTO users (name, email, password_hash)
             VALUES ($1, $2, $3)
             RETURNING id, name, email`,
            [trimmedName, trimmedEmail, hashedPassword]
        );

        res.status(201).json({
            message: 'Registration successful',
            user: result.rows[0]
        });

    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({
                message: 'Email is already registered'
            });
        }

        console.error('Registration error:', error);

        res.status(500).json({
            message: 'Something went wrong during registration'
        });
    }
});

// User login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check whether email and password are provided
        if (!email || !password) {
            return res.status(400).json({
                message: 'Email and password are required'
            });
        }

        const trimmedEmail = email.trim().toLowerCase();

        // Find the user using their email
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [trimmedEmail]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

        const user = result.rows[0];

        // Compare the entered password with the stored hash
        const isPasswordValid = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

        // Generate a JWT token
        const token = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            message: 'Login successful',
            token: token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Login error:', error);

        res.status(500).json({
            message: 'Something went wrong during login'
        });
    }
});

module.exports = router;