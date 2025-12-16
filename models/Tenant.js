const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    month: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    paid: {
        type: Boolean,
        default: false
    },
    proofUrl: {
        type: String,
        default: ''
    }
}, { _id: false });

const tenantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    deleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date,
        default: null
    },
    roomNumber: {
        type: String,
        required: true,
        trim: true
    },
    contact: {
        type: String,
        required: true,
        trim: true
    },
    rentAmount: {
        type: Number,
        required: true,
        min: 0
    },
    deposit: {
        type: Number,
        required: true,
        min: 0
    },
    joinDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    rentHistory: [paymentSchema]
}, {
    timestamps: true
});

module.exports = mongoose.model('Tenant', tenantSchema);

