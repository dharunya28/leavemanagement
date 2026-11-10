
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Staff = require("../models/Staff");

async function resetStaff() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const email = "staff@gmail.com";
        const password = "Staff@123";

        const hashedPassword = await bcrypt.hash(password, 10);

        const staff = await Staff.findOneAndUpdate(
            { email: email },
            {
                $set: {
                    name: "Admin Staff",
                    email: email,
                    password: hashedPassword,
                    department: "Administration",
                    role: "staff"
                }
            },
            {
                returnDocument: "after",
                upsert: true
            }
        );

        console.log("\n===== STAFF PASSWORD RESET SUCCESSFUL =====");
        console.log("Staff Name:", staff.name);
        console.log("Staff Email:", staff.email);
        console.log("Password: Staff@123");
        console.log("============================================");

    } catch (error) {
        console.log("Error:", error.message);
    } finally {
        await mongoose.disconnect();
    }
}

resetStaff();
