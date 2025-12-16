const express = require('express');
const router = express.Router();
const Tenant = require('../models/Tenant');

// Get active tenants (non-deleted)
router.get('/', async (req, res) => {
    try {
        const tenants = await Tenant.find({ deleted: { $ne: true } }).sort({ createdAt: -1 });
        res.json(tenants);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all tenants including deleted
router.get('/all', async (req, res) => {
    try {
        const tenants = await Tenant.find({})
            .sort({ createdAt: -1 })
            .lean();
        res.json(tenants);
    } catch (error) {
        console.error('Error fetching all tenants', error);
        res.status(500).json({ error: error.message || 'Failed to fetch archive' });
    }
});

// Get single tenant
router.get('/:id', async (req, res) => {
    try {
        const tenant = await Tenant.findById(req.params.id);
        if (!tenant) {
            return res.status(404).json({ error: 'Tenant not found' });
        }
        res.json(tenant);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create tenant
router.post('/', async (req, res) => {
    try {
        const tenant = new Tenant(req.body);
        await tenant.save();
        res.status(201).json(tenant);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update tenant
router.put('/:id', async (req, res) => {
    try {
        const tenant = await Tenant.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!tenant) {
            return res.status(404).json({ error: 'Tenant not found' });
        }
        res.json(tenant);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Soft delete tenant (retain record for history)
router.delete('/:id', async (req, res) => {
    try {
        const tenant = await Tenant.findById(req.params.id);
        if (!tenant) {
            return res.status(404).json({ error: 'Tenant not found' });
        }

        tenant.deleted = true;
        tenant.deletedAt = new Date();
        await tenant.save();

        res.json({ message: 'Tenant archived (soft deleted)' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add/Update payment record
router.post('/:id/payment', async (req, res) => {
    try {
        const tenant = await Tenant.findById(req.params.id);
        if (!tenant) {
            return res.status(404).json({ error: 'Tenant not found' });
        }

        const { month, amount, date, paid, proofUrl } = req.body;

        // Check if payment for this month already exists
        const existingIndex = tenant.rentHistory.findIndex(r => r.month === month);

        const paymentRecord = {
            month,
            amount,
            date: new Date(date),
            paid: paid === true || paid === 'true',
            proofUrl: proofUrl || ''
        };

        if (existingIndex >= 0) {
            // Update existing payment
            tenant.rentHistory[existingIndex] = paymentRecord;
        } else {
            // Add new payment
            tenant.rentHistory.push(paymentRecord);
        }

        // Sort by month (newest first)
        tenant.rentHistory.sort((a, b) => b.month.localeCompare(a.month));

        await tenant.save();
        res.json(tenant);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;

