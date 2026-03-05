const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const routes = require('./routes');
const { initDB } = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// API Routes
app.use('/api', routes);

// Base Route
app.get('/', (req, res) => {
    res.json({
        name: "CITIL Campus Inventory API",
        version: "1.0.0",
        status: "Running"
    });
});

// Initialize DB and Start Server
initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`================================================`);
        console.log(`  CITIL Backend Server running on port ${PORT}`);
        console.log(`  Endpoint Registry: http://localhost:${PORT}/api/register`);
        console.log(`================================================`);
    });
}).catch(err => {
    console.error("Failed to initialize database:", err);
});
