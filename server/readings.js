
const express = require('express');
const pool = require('./db');
const verifyToken = require('./middleware');

const router = express.Router();

// Protect all reading routes
router.use(verifyToken);

// Allowed reading time slots
const allowedSlots = [
    'Morning fasting',
    'After breakfast',
    'After lunch',
    'After dinner'
];

// Get all readings of the logged-in user
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, reading_date, time_slot, glucose_level, created_at
             FROM readings
             WHERE user_id = $1
             ORDER BY reading_date DESC, created_at DESC`,
            [req.user.id]
        );

        res.json(result.rows);

    } catch (error) {
        console.error('Fetch readings error:', error);

        res.status(500).json({
            message: 'Unable to fetch readings'
        });
    }
});

// Add a new glucose reading
router.post('/', async (req, res) => {
    try {
        const { reading_date, time_slot, glucose_level } = req.body;

        // Check whether all fields are provided
        if (!reading_date || !time_slot || glucose_level === undefined || glucose_level === null || glucose_level === '') {
            return res.status(400).json({
                message: 'Date, time slot and glucose level are required'
            });
        }

        // Validate date format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(reading_date)) {
            return res.status(400).json({
                message: 'Date must be in YYYY-MM-DD format'
            });
        }

        const dateObject = new Date(`${reading_date}T00:00:00.000Z`);

        if (Number.isNaN(dateObject.getTime()) || dateObject.toISOString().slice(0, 10) !== reading_date) {
            return res.status(400).json({
                message: 'Please enter a valid date'
            });
        }

        // Prevent future dates
        const today = new Date().toISOString().slice(0, 10);

        if (reading_date > today) {
            return res.status(400).json({
                message: 'Future dates are not allowed'
            });
        }

        // Validate time slot
        if (!allowedSlots.includes(time_slot)) {
            return res.status(400).json({
                message: 'Please select a valid time slot'
            });
        }

        // Validate glucose level
        const level = Number(glucose_level);

        if (!Number.isInteger(level) || level < 40 || level > 600) {
            return res.status(400).json({
                message: 'Glucose level must be a whole number between 40 and 600 mg/dL'
            });
        }

        // Save the reading for the logged-in user
        const result = await pool.query(
            `INSERT INTO readings
             (user_id, reading_date, time_slot, glucose_level)
             VALUES ($1, $2, $3, $4)
             RETURNING id, reading_date, time_slot, glucose_level`,
            [req.user.id, reading_date, time_slot, level]
        );

        res.status(201).json({
            message: 'Reading added successfully',
            reading: result.rows[0]
        });

    } catch (error) {
        // Handle duplicate reading for the same date and slot
        if (error.code === '23505') {
            return res.status(409).json({
                message: 'A reading already exists for this date and time slot'
            });
        }

        console.error('Add reading error:', error);

        res.status(500).json({
            message: 'Unable to add reading'
        });
    }
});


// Update an existing glucose reading
router.put('/:id', async (req, res) => {
    try {
        const readingId = Number(req.params.id);
        const { reading_date, time_slot, glucose_level } = req.body;

        if (!Number.isInteger(readingId) || readingId <= 0) {
            return res.status(400).json({
                message: 'Invalid reading ID'
            });
        }

        if (!reading_date || !time_slot || glucose_level === undefined || glucose_level === null || glucose_level === '') {
            return res.status(400).json({
                message: 'Date, time slot and glucose level are required'
            });
        }

        if (!/^\d{4}-\d{2}-\d{2}$/.test(reading_date)) {
            return res.status(400).json({
                message: 'Date must be in YYYY-MM-DD format'
            });
        }

        const dateObject = new Date(`${reading_date}T00:00:00.000Z`);

        if (Number.isNaN(dateObject.getTime()) || dateObject.toISOString().slice(0, 10) !== reading_date) {
            return res.status(400).json({
                message: 'Please enter a valid date'
            });
        }

        const today = new Date().toISOString().slice(0, 10);

        if (reading_date > today) {
            return res.status(400).json({
                message: 'Future dates are not allowed'
            });
        }

        if (!allowedSlots.includes(time_slot)) {
            return res.status(400).json({
                message: 'Please select a valid time slot'
            });
        }

        const level = Number(glucose_level);

        if (!Number.isInteger(level) || level < 40 || level > 600) {
            return res.status(400).json({
                message: 'Glucose level must be a whole number between 40 and 600 mg/dL'
            });
        }

        const result = await pool.query(
            `UPDATE readings
             SET reading_date = $1,
                 time_slot = $2,
                 glucose_level = $3
             WHERE id = $4 AND user_id = $5
             RETURNING id, reading_date, time_slot, glucose_level`,
            [reading_date, time_slot, level, readingId, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Reading not found'
            });
        }

        res.json({
            message: 'Reading updated successfully',
            reading: result.rows[0]
        });

    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({
                message: 'A reading already exists for this date and time slot'
            });
        }

        console.error('Update reading error:', error);

        res.status(500).json({
            message: 'Unable to update reading'
        });
    }
});

// Delete an existing glucose reading
router.delete('/:id', async (req, res) => {
    try {
        const readingId = Number(req.params.id);

        if (!Number.isInteger(readingId) || readingId <= 0) {
            return res.status(400).json({
                message: 'Invalid reading ID'
            });
        }

        const result = await pool.query(
            `DELETE FROM readings
             WHERE id = $1 AND user_id = $2
             RETURNING id`,
            [readingId, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Reading not found'
            });
        }

        res.json({
            message: 'Reading deleted successfully'
        });

    } catch (error) {
        console.error('Delete reading error:', error);

        res.status(500).json({
            message: 'Unable to delete reading'
        });
    }
});


// Generate a date in YYYY-MM-DD format using local server time
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

// Get daily glucose report
router.get('/reports/daily', async (req, res) => {
    try {
        const reportDate = req.query.date || formatDate(new Date());

        if (!/^\d{4}-\d{2}-\d{2}$/.test(reportDate)) {
            return res.status(400).json({
                message: 'Date must be in YYYY-MM-DD format'
            });
        }

        const dateObject = new Date(`${reportDate}T00:00:00.000Z`);

        if (Number.isNaN(dateObject.getTime()) ||
            dateObject.toISOString().slice(0, 10) !== reportDate) {
            return res.status(400).json({
                message: 'Please enter a valid date'
            });
        }

        const readingsResult = await pool.query(
            `SELECT
                TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date,
                time_slot,
                glucose_level
             FROM readings
             WHERE user_id = $1 AND reading_date = $2
             ORDER BY time_slot`,
            [req.user.id, reportDate]
        );

        const summaryResult = await pool.query(
            `SELECT
                COUNT(*)::int AS count,
                MAX(glucose_level)::int AS high,
                MIN(glucose_level)::int AS low,
                ROUND(AVG(glucose_level)::numeric, 1) AS average
             FROM readings
             WHERE user_id = $1 AND reading_date = $2`,
            [req.user.id, reportDate]
        );

        res.json({
            report_type: 'daily',
            date: reportDate,
            summary: summaryResult.rows[0],
            readings: readingsResult.rows
        });

    } catch (error) {
        console.error('Daily report error:', error);

        res.status(500).json({
            message: 'Unable to generate daily report'
        });
    }
});

// Get month-to-date report
router.get('/reports/month-to-date', async (req, res) => {
    try {
        const today = new Date();
        const startDate = formatDate(
            new Date(today.getFullYear(), today.getMonth(), 1)
        );
        const endDate = formatDate(today);

        const result = await pool.query(
            `SELECT
                COUNT(*)::int AS count,
                MAX(glucose_level)::int AS high,
                MIN(glucose_level)::int AS low,
                ROUND(AVG(glucose_level)::numeric, 1) AS average
             FROM readings
             WHERE user_id = $1
             AND reading_date BETWEEN $2 AND $3`,
            [req.user.id, startDate, endDate]
        );

        res.json({
            report_type: 'month-to-date',
            start_date: startDate,
            end_date: endDate,
            summary: result.rows[0]
        });

    } catch (error) {
        console.error('Month-to-date report error:', error);

        res.status(500).json({
            message: 'Unable to generate month-to-date report'
        });
    }
});

// Get previous full month report
router.get('/reports/previous-month', async (req, res) => {
    try {
        const today = new Date();

        const firstDayPreviousMonth = new Date(
            today.getFullYear(),
            today.getMonth() - 1,
            1
        );

        const lastDayPreviousMonth = new Date(
            today.getFullYear(),
            today.getMonth(),
            0
        );

        const startDate = formatDate(firstDayPreviousMonth);
        const endDate = formatDate(lastDayPreviousMonth);

        const result = await pool.query(
            `SELECT
                COUNT(*)::int AS count,
                MAX(glucose_level)::int AS high,
                MIN(glucose_level)::int AS low,
                ROUND(AVG(glucose_level)::numeric, 1) AS average
             FROM readings
             WHERE user_id = $1
             AND reading_date BETWEEN $2 AND $3`,
            [req.user.id, startDate, endDate]
        );

        res.json({
            report_type: 'previous-month',
            start_date: startDate,
            end_date: endDate,
            summary: result.rows[0]
        });

    } catch (error) {
        console.error('Previous month report error:', error);

        res.status(500).json({
            message: 'Unable to generate previous month report'
        });
    }
});
 
module.exports = router;
