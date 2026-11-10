
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Staff = require("../models/Staff");

const createStaff = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const { STAFF_NAME, STAFF_EMAIL, STAFF_PASSWORD } = process.env;

        if (!STAFF_NAME || !STAFF_EMAIL || !STAFF_PASSWORD) {
            throw new Error("Staff details are missing in .env file");
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
            email: STAFF_EMAIL,
            password: hashedPassword,
            department: "Administration",
            role: "staff"
        });

        console.log("Staff account created successfully!");
        console.log("Staff Email:", STAFF_EMAIL);

    } catch (error) {
        console.error("Staff creation error:", error.message);
    } finally {
        await mongoose.disconnect();
    }
};

createStaff();
