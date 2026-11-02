const express = require('express');
const pool = require('./db');
const authRoutes = require('./auth');
const verifyToken = require('./middleware');
const readingRoutes = require('./readings');
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(cors());
app.use('/api/auth', authRoutes);
app.use('/api/readings', readingRoutes);


app.get('/', (req, res) => {
    res.send('Sweety Blood Glucose Tracker API is running!');
});

app.get('/api/health', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT current_database() AS database'
        );

        res.json({
            status: 'healthy',
            database: result.rows[0].database
        });

    } catch (error) {
        console.error('Database connection error:', error);

        res.status(500).json({
            status: 'error',
            message: 'Database connection failed'
        });
    }
});

// Protected route to check user authentication
app.get('/api/protected', verifyToken, (req, res) => {
    res.json({
        message: 'You are authenticated!',
        userId: req.user.id
    });
});
const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});