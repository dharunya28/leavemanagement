
const Student = require("../models/Student");
const Staff = require("../models/Staff");

// Check whether user is logged in
const isAuthenticated = (req, res, next) => {
    if (!req.session || !req.session.userId || !req.session.role) {
        return res.status(401).json({
            success: false,
            message: "Please login first"
        });
    }

    next();
};

// Allow only students
const isStudent = async (req, res, next) => {
    try {
        if (req.session.role !== "student") {
            return res.status(403).json({
                success: false,
                message: "Student access only"
            });
        }

        const student = await Student.findById(req.session.userId);

        if (!student) {
            return res.status(401).json({
                success: false,
                message: "Student account not found"
            });
        }

        req.student = student;
        next();

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Authentication error"
        });
    }
};

// Allow only staff
const isStaff = async (req, res, next) => {
    try {
        if (req.session.role !== "staff") {
            return res.status(403).json({
                success: false,
                message: "Staff access only"
            });
        }

        const staff = await Staff.findById(req.session.userId);

        if (!staff) {
            return res.status(401).json({
                success: false,
                message: "Staff account not found"
            });
        }

        req.staff = staff;
        next();

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Authentication error"
        });
    }
};

module.exports = {
    isAuthenticated,
    isStudent,
    isStaff
};
