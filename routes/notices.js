const express = require('express');
const router = express.Router();
const Notice = require('../models/Notice');

// Get all notices
router.get('/', async (req, res) => {
    try {
        const notices = await Notice.find().sort({ createdAt: -1 });
        res.json(notices);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single notice
router.get('/:id', async (req, res) => {
    try {
        const notice = await Notice.findById(req.params.id);
        if (!notice) {
            return res.status(404).json({ error: 'Notice not found' });
        }
        res.json(notice);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create notice
router.post('/', async (req, res) => {
    try {
        const notice = new Notice(req.body);
        await notice.save();
        res.status(201).json(notice);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update notice
router.put('/:id', async (req, res) => {
    try {
        const notice = await Notice.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!notice) {
            return res.status(404).json({ error: 'Notice not found' });
        }
        res.json(notice);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete notice
router.delete('/:id', async (req, res) => {
    try {
        const notice = await Notice.findByIdAndDelete(req.params.id);
        if (!notice) {
            return res.status(404).json({ error: 'Notice not found' });
        }
        res.json({ message: 'Notice deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

