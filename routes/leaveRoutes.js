
const express = require("express");
const router = express.Router();

const Leave = require("../models/Leave");
const Student = require("../models/Student");
const { isStudent, isStaff } = require("../middleware/authMiddleware");

// ==================================
// STUDENT: APPLY FOR LEAVE
// ==================================
router.post("/apply", isStudent, async (req, res) => {
    try {
        const { leaveType, fromDate, toDate, reason } = req.body;

        if (!leaveType || !fromDate || !toDate || !reason) {
            return res.status(400).json({
                success: false,
                message: "Please fill all fields"
            });
        }

        const start = new Date(fromDate);
        const end = new Date(toDate);

        if (
            Number.isNaN(start.getTime()) ||
            Number.isNaN(end.getTime()) ||
            start > end
        ) {
            return res.status(400).json({
                success: false,
                message: "Please enter valid leave dates"
            });
        }

        // Calculate inclusive leave days
        const startDay = Date.UTC(
            start.getUTCFullYear(),
            start.getUTCMonth(),
            start.getUTCDate()
        );

        const endDay = Date.UTC(
            end.getUTCFullYear(),
            end.getUTCMonth(),
            end.getUTCDate()
        );

        const totalDays = Math.round(
            (endDay - startDay) / 86400000
        ) + 1;

        const leave = await Leave.create({
            student: req.student._id,
            studentName: req.student.name,
            registerNumber: req.student.registerNumber,
            department: req.student.department,
            leaveType,
            fromDate: start,
            toDate: end,
            totalDays,
            reason
        });

        res.status(201).json({
            success: true,
            message: "Leave application submitted successfully",
            leave
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Unable to apply for leave"
        });
    }
});


// ==================================
// STUDENT: VIEW OWN LEAVE HISTORY
// ==================================
router.get("/my-leaves", isStudent, async (req, res) => {
    try {
        const leaves = await Leave.find({
            student: req.student._id
        }).sort({ createdAt: -1 });

        res.json({
            success: true,
            leaves
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Unable to fetch leave history"
        });
    }
});


// ==================================
// STUDENT: VIEW LEAVE BALANCE
// ==================================
router.get("/balance", isStudent, async (req, res) => {
    try {
        const student = await Student.findById(req.student._id);

        res.json({
            success: true,
            totalLeave: student.totalLeave,
            usedLeave: student.usedLeave,
            remainingLeave: student.totalLeave - student.usedLeave
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Unable to fetch leave balance"
        });
    }
});


// ==================================
// STAFF: VIEW ALL LEAVE REQUESTS
// ==================================
router.get("/all", isStaff, async (req, res) => {
    try {
        const leaves = await Leave.find()
            .populate("student", "name email registerNumber")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            leaves
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Unable to fetch leave requests"
        });
    }
});


// ==================================
// STAFF: APPROVE OR REJECT LEAVE
// ==================================
router.patch("/:id/status", isStaff, async (req, res) => {
    try {
        const { status, staffRemark } = req.body;

        if (!["Approved", "Rejected"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid leave status"
            });
        }

        // Only one staff action can change a pending request
        const leave = await Leave.findOne({
            _id: req.params.id,
            status: "Pending"
        });

        if (!leave) {
            return res.status(404).json({
                success: false,
                message: "Pending leave request not found or already processed"
            });
        }

        if (status === "Approved") {
            // Deduct balance only if sufficient balance exists
            const student = await Student.findOneAndUpdate(
                {
                    _id: leave.student,
                    $expr: {
                        $lte: [
                            { $add: ["$usedLeave", leave.totalDays] },
                            "$totalLeave"
                        ]
                    }
                },
                {
                    $inc: { usedLeave: leave.totalDays }
                },
                { new: true }
            );

            if (!student) {
                return res.status(400).json({
                    success: false,
                    message: "Student has insufficient leave balance"
                });
            }
        }

        // Change request status only after balance update
        const updatedLeave = await Leave.findOneAndUpdate(
            {
                _id: leave._id,
                status: "Pending"
            },
            {
                $set: {
                    status,
                    staffRemark: staffRemark || "",
                    approvedBy: req.staff._id
                }
            },
            { new: true }
        );

        // Roll back balance if another staff action processed it first
        if (!updatedLeave && status === "Approved") {
            await Student.updateOne(
                { _id: leave.student },
                { $inc: { usedLeave: -leave.totalDays } }
            );
        }

        if (!updatedLeave) {
            return res.status(409).json({
                success: false,
                message: "This request was already processed"
            });
        }

        res.json({
            success: true,
            message: `Leave ${status.toLowerCase()} successfully`,
            leave: updatedLeave
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Unable to update leave status"
        });
    }
});

module.exports = router;
