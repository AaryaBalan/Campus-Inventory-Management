const express = require('express');
const router = express.Router();
const { registerSystem, getRegisteredSystems, heartbeat } = require('./models');

/**
 * @route   POST /api/register
 * @desc    Register a new endpoint agent or update existing one
 * @access  Public (Optionally secure with X-API-Key)
 */
router.post('/register', async (req, res) => {
    try {
        const data = req.body;

        // Basic Validation
        if (!data.mac || !data.hostname || !data.ip) {
            return res.status(400).json({ error: "Missing required fields: mac, hostname, ip" });
        }

        const result = await registerSystem(data);
        res.status(result.status === 'created' ? 201 : 200).json(result);
    } catch (err) {
        console.error("Registration Error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

/**
 * @route   POST /api/heartbeat
 * @desc    Update last_seen for an endpoint
 */
router.post('/heartbeat', async (req, res) => {
    try {
        const { mac } = req.body;
        if (!mac) return res.status(400).json({ error: "MAC required for heartbeat" });

        await heartbeat(mac);
        res.json({ status: "ok" });
    } catch (err) {
        res.status(500).json({ error: "Heartbeat processing failed" });
    }
});

/**
 * @route   GET /api/systems
 * @desc    Fetch all registered systems for dashboard
 */
router.get('/systems', async (req, res) => {
    try {
        const systems = await getRegisteredSystems();
        res.json(systems);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch systems" });
    }
});

module.exports = router;
