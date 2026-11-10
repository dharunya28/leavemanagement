
const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema({

    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
        required: true
    },

    studentName: {
        type: String,
        required: true
    },

    registerNumber: {
        type: String,
        required: true
    },

    department: {
        type: String,
        required: true
    },

    leaveType: {
        type: String,
        enum: ["Sick Leave", "Casual Leave", "Emergency Leave"],
        required: true
    },

    fromDate: {
        type: Date,
        required: true
    },

    toDate: {
        type: Date,
        required: true
    },

    totalDays: {
        type: Number,
        required: true,
        min: 1
    },

    reason: {
        type: String,
        required: true,
        trim: true
    },

    status: {
        type: String,
        enum: ["Pending", "Approved", "Rejected"],
        default: "Pending"
    },

    staffRemark: {
        type: String,
        default: ""
    },

    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Staff",
        default: null
    }

}, { timestamps: true });

module.exports = mongoose.model("Leave", leaveSchema);
