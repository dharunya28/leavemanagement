
const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    registerNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    department: {
        type: String,
        required: true
    },
    year: {
        type: String,
        required: true
    },
    totalLeave: {
        type: Number,
        default: 12
    },
    usedLeave: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model("Student", studentSchema);
