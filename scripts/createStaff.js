require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Staff = require("../models/Staff");

// Helper to seed initial staff account if provided in env
const seedInitialStaff = async () => {
    try {
        const { STAFF_NAME, STAFF_EMAIL, STAFF_PASSWORD } = process.env;

        if (!STAFF_NAME || !STAFF_EMAIL || !STAFF_PASSWORD) {
            return;
        }

        const existingStaff = await Staff.findOne({
            email: STAFF_EMAIL.toLowerCase()
        });

        if (existingStaff) {
            return;
        }

        const hashedPassword = await bcrypt.hash(STAFF_PASSWORD, 10);

        await Staff.create({
            name: STAFF_NAME,
            email: STAFF_EMAIL.toLowerCase(),
            password: hashedPassword,
            department: "Administration",
            role: "staff"
        });

        console.log(`Staff account created successfully for: ${STAFF_EMAIL.toLowerCase()}`);

    } catch (error) {
        console.error("Staff auto-seeding error:", error.message);
    }
};

// Standalone execution when run directly via CLI
const createStaffStandalone = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI is not set in environment variables");
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB for staff seeding.");

        const { STAFF_NAME, STAFF_EMAIL, STAFF_PASSWORD } = process.env;

        if (!STAFF_NAME || !STAFF_EMAIL || !STAFF_PASSWORD) {
            throw new Error("Staff details (STAFF_NAME, STAFF_EMAIL, STAFF_PASSWORD) are missing in .env file");
        }

        const existingStaff = await Staff.findOne({
            email: STAFF_EMAIL.toLowerCase()
        });

        if (existingStaff) {
            console.log("Staff account already exists!");
            return;
        }

        const hashedPassword = await bcrypt.hash(STAFF_PASSWORD, 10);

        await Staff.create({
            name: STAFF_NAME,
            email: STAFF_EMAIL.toLowerCase(),
            password: hashedPassword,
            department: "Administration",
            role: "staff"
        });

        console.log("Staff account created successfully!");
        console.log("Staff Email:", STAFF_EMAIL.toLowerCase());

    } catch (error) {
        console.error("Staff creation error:", error.message);
    } finally {
        await mongoose.disconnect();
    }
};

if (require.main === module) {
    createStaffStandalone();
}

module.exports = { seedInitialStaff };
