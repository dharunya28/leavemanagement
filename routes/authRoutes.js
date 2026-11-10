
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");

const Student = require("../models/Student");
const Staff = require("../models/Staff");

// =====================================
// STUDENT REGISTRATION
// POST /api/auth/student/register
// =====================================

router.post("/student/register", async (req, res) => {
    try {
        const {
            name,
            registerNumber,
            email,
            password,
            department,
            year
        } = req.body;

        if (
            !name ||
            !registerNumber ||
            !email ||
            !password ||
            !department ||
            !year
        ) {
            return res.status(400).json({
                success: false,
                message: "Please fill all the fields"
            });
        }

        const existingStudent = await Student.findOne({
            $or: [
                { email: email.toLowerCase() },
                { registerNumber: registerNumber }
            ]
        });

        if (existingStudent) {
            return res.status(400).json({
                success: false,
                message: "Email or Register Number already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const student = await Student.create({
            name,
            registerNumber,
            email: email.toLowerCase(),
            password: hashedPassword,
            department,
            year
        });

        // BACKEND TERMINAL OUTPUT
        console.log("\n========== NEW STUDENT REGISTERED ==========");
        console.log("Name:", student.name);
        console.log("Register Number:", student.registerNumber);
        console.log("Email:", student.email);
        console.log("Department:", student.department);
        console.log("Year:", student.year);
        console.log("============================================\n");

        res.status(201).json({
            success: true,
            message: "Student registered successfully"
        });

    } catch (error) {
        console.error("Student Registration Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Student registration failed"
        });
    }
});


// =====================================
// STUDENT LOGIN
// POST /api/auth/student/login
// =====================================

router.post("/student/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const student = await Student.findOne({
            email: email?.toLowerCase()
        });

        if (!student) {
            console.log("Student login failed: Email not found");
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const isMatch = await bcrypt.compare(
            password,
            student.password
        );

        if (!isMatch) {
            console.log("Student login failed: Invalid password");
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        req.session.userId = student._id;
        req.session.role = "student";

        req.session.save((error) => {
            if (error) {
                return res.status(500).json({
                    success: false,
                    message: "Session creation failed"
                });
            }

            // BACKEND TERMINAL OUTPUT
            console.log("\n============== STUDENT LOGIN ==============");
            console.log("Student Name:", student.name);
            console.log("Register Number:", student.registerNumber);
            console.log("Email:", student.email);
            console.log("===========================================\n");

            res.json({
                success: true,
                message: "Student login successful",
                role: "student"
            });
        });

    } catch (error) {
        console.error("Student Login Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Student login failed"
        });
    }
});


// =====================================
// STAFF LOGIN
// POST /api/auth/staff/login
// =====================================

router.post("/staff/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const staff = await Staff.findOne({
            email: email?.toLowerCase()
        });

        if (!staff) {
            console.log("Staff login failed: Email not found");
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const isMatch = await bcrypt.compare(
            password,
            staff.password
        );

        if (!isMatch) {
            console.log("Staff login failed: Invalid password");
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        req.session.userId = staff._id;
        req.session.role = "staff";

        req.session.save((error) => {
            if (error) {
                return res.status(500).json({
                    success: false,
                    message: "Session creation failed"
                });
            }

            // BACKEND TERMINAL OUTPUT
            console.log("\n=============== STAFF LOGIN ===============");
            console.log("Staff Name:", staff.name);
            console.log("Staff Email:", staff.email);
            console.log("===========================================\n");

            res.json({
                success: true,
                message: "Staff login successful",
                role: "staff"
            });
        });

    } catch (error) {
        console.error("Staff Login Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Staff login failed"
        });
    }
});


// =====================================
// GET LOGGED-IN USER
// GET /api/auth/me
// =====================================

router.get("/me", async (req, res) => {
    try {
        if (!req.session.userId || !req.session.role) {
            return res.status(401).json({
                success: false,
                message: "Please login first"
            });
        }

        let user;

        if (req.session.role === "student") {
            user = await Student.findById(req.session.userId)
                .select("-password");
        } else if (req.session.role === "staff") {
            user = await Staff.findById(req.session.userId)
                .select("-password");
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            role: req.session.role,
            user
        });

    } catch (error) {
        console.error("Get User Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to get user details"
        });
    }
});


// =====================================
// LOGOUT
// POST /api/auth/logout
// =====================================

router.post("/logout", (req, res) => {
    const role = req.session.role;

    req.session.destroy((error) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: "Logout failed"
            });
        }

        res.clearCookie("connect.sid");

        console.log("\n============== USER LOGOUT ==============");
        console.log("Role:", role);
        console.log("User logged out successfully");
        console.log("=========================================\n");

        res.json({
            success: true,
            message: "Logout successful"
        });
    });
});

module.exports = router;
