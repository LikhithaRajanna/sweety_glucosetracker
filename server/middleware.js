
const jwt = require('jsonwebtoken');

// Verify the user's login token
function verifyToken(req, res, next) {
    // Get the token from the request header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            message: 'Access denied. Please login first.'
        });
    }

    // Extract the token after the word Bearer
    const token = authHeader.split(' ')[1];

    try {
        // Verify the token using our secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Store the logged-in user's ID in the request
        req.user = decoded;

        // Continue to the requested route
        next();

    } catch (error) {
        return res.status(401).json({
            message: 'Invalid or expired token'
        });
    }
}

module.exports = verifyToken;
