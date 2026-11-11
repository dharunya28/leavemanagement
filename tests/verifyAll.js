/**
 * Comprehensive Test Suite for Student Leave Management System
 * Tests:
 * 1. Health check (/api/health)
 * 2. Student registration & duplicate prevention
 * 3. Student login (valid & invalid)
 * 4. Authenticated profile check (/api/auth/me)
 * 5. Leave application submission
 * 6. Leave history retrieval (/api/leaves/my-leaves)
 * 7. Leave balance check (/api/leaves/balance)
 * 8. Staff login
 * 9. Staff view all leave applications (/api/leaves/all)
 * 10. Staff approve leave & leave balance deduction verification
 * 11. Staff reject leave & leave balance unchanged verification
 * 12. Insufficient leave balance rejection verification
 * 13. Logout (/api/auth/logout)
 * 14. Automatic test data cleanup
 */

require("dotenv").config();
const http = require("http");
const mongoose = require("mongoose");
const express = require("express");
const session = require("express-session");
const path = require("path");

const Student = require("../models/Student");
const Staff = require("../models/Staff");
const Leave = require("../models/Leave");

const authRoutes = require("../routes/authRoutes");
const leaveRoutes = require("../routes/leaveRoutes");

// Helper to make HTTP requests and preserve session cookies
class SessionClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        this.cookies = [];
    }

    async request(method, endpoint, body = null) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            "Content-Type": "application/json"
        };

        if (this.cookies.length > 0) {
            headers["Cookie"] = this.cookies.join("; ");
        }

        const options = {
            method,
            headers
        };

        if (body && (method === "POST" || method === "PATCH" || method === "PUT")) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(url, options);

        // Store received cookies
        const setCookieHeaders = response.headers.getSetCookie 
            ? response.headers.getSetCookie() 
            : (response.headers.get("set-cookie") ? [response.headers.get("set-cookie")] : []);

        for (const cookieStr of setCookieHeaders) {
            const cookiePart = cookieStr.split(";")[0];
            const name = cookiePart.split("=")[0];
            this.cookies = this.cookies.filter(c => !c.startsWith(`${name}=`));
            this.cookies.push(cookiePart);
        }

        let json = null;
        try {
            json = await response.json();
        } catch (e) {
            // non-json response
        }

        return {
            status: response.status,
            ok: response.ok,
            data: json
        };
    }

    get(endpoint) {
        return this.request("GET", endpoint);
    }

    post(endpoint, body) {
        return this.request("POST", endpoint, body);
    }

    patch(endpoint, body) {
        return this.request("PATCH", endpoint, body);
    }
}

async function runTests() {
    console.log("=================================================");
    console.log("🧪 STARTING SYSTEM VERIFICATION TESTS");
    console.log("=================================================");

    if (!process.env.MONGODB_URI) {
        console.error("❌ MONGODB_URI is not defined in .env");
        process.exit(1);
    }

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB for test suite");

    // Initialize test express app on ephemeral port
    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.use(
        session({
            secret: process.env.SESSION_SECRET || "test-session-secret",
            resave: false,
            saveUninitialized: false,
            cookie: {
                maxAge: 24 * 60 * 60 * 1000,
                httpOnly: true
            }
        })
    );

    app.get("/api/health", (req, res) => {
        res.status(200).json({ success: true, message: "Server is healthy" });
    });

    app.use("/api/auth", authRoutes);
    app.use("/api/leaves", leaveRoutes);

    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;
    console.log(`✅ Test server running on ${baseUrl}\n`);

    const timestamp = Date.now();
    const testStudent = {
        name: `Test Student ${timestamp}`,
        registerNumber: `REG_${timestamp}`,
        email: `student_${timestamp}@test.edu`,
        password: "StudentPassword123!",
        department: "Information Technology",
        year: "3rd Year"
    };

    let staffEmail = process.env.STAFF_EMAIL || "staff@gmail.com";
    let staffPassword = process.env.STAFF_PASSWORD || "Staff@123";

    // Ensure staff account exists for testing
    let staffUser = await Staff.findOne({ email: staffEmail.toLowerCase() });
    if (!staffUser) {
        const bcrypt = require("bcryptjs");
        staffUser = await Staff.create({
            name: process.env.STAFF_NAME || "Test Staff",
            email: staffEmail.toLowerCase(),
            password: await bcrypt.hash(staffPassword, 10),
            department: "Administration",
            role: "staff"
        });
        console.log("✅ Seeded test staff account");
    }

    let passedCount = 0;
    let failedCount = 0;

    const assert = (condition, description) => {
        if (condition) {
            console.log(`  ✅ PASS: ${description}`);
            passedCount++;
        } else {
            console.error(`  ❌ FAIL: ${description}`);
            failedCount++;
        }
    };

    try {
        const studentClient = new SessionClient(baseUrl);
        const staffClient = new SessionClient(baseUrl);

        // TEST 1: Health check
        console.log("1. Health Check");
        const healthRes = await studentClient.get("/api/health");
        assert(healthRes.status === 200 && healthRes.data.success === true, "Health endpoint returns 200 OK");

        // TEST 2: Student Registration
        console.log("\n2. Student Registration");
        const regRes = await studentClient.post("/api/auth/student/register", testStudent);
        assert(regRes.status === 201 && regRes.data.success === true, "Student registers successfully");

        // TEST 3: Duplicate Registration Prevention
        console.log("\n3. Duplicate Student Registration Prevention");
        const dupRegRes = await studentClient.post("/api/auth/student/register", testStudent);
        assert(dupRegRes.status === 400 && dupRegRes.data.success === false, "Duplicate registration rejected with 400");

        // TEST 4: Student Login with Invalid Password
        console.log("\n4. Student Login (Invalid credentials)");
        const badLoginRes = await studentClient.post("/api/auth/student/login", {
            email: testStudent.email,
            password: "WrongPassword"
        });
        assert(badLoginRes.status === 401 && badLoginRes.data.success === false, "Bad credentials rejected with 401");

        // TEST 5: Student Login with Valid Password
        console.log("\n5. Student Login (Valid credentials)");
        const loginRes = await studentClient.post("/api/auth/student/login", {
            email: testStudent.email,
            password: testStudent.password
        });
        assert(loginRes.status === 200 && loginRes.data.role === "student", "Student logs in successfully");

        // TEST 6: Student Me Profile
        console.log("\n6. Student Profile Verification (/api/auth/me)");
        const meRes = await studentClient.get("/api/auth/me");
        assert(
            meRes.status === 200 && meRes.data.user.email === testStudent.email.toLowerCase(),
            "Student profile retrieved matching session"
        );

        // TEST 7: Initial Leave Balance
        console.log("\n7. Initial Leave Balance Check");
        const balRes = await studentClient.get("/api/leaves/balance");
        assert(
            balRes.status === 200 && balRes.data.totalLeave === 12 && balRes.data.usedLeave === 0 && balRes.data.remainingLeave === 12,
            "Initial leave balance is 12 total, 0 used, 12 remaining"
        );

        // TEST 8: Student Apply for Leave (2 days)
        console.log("\n8. Student Leave Application (2 days: 2026-11-20 to 2026-11-21)");
        const applyRes = await studentClient.post("/api/leaves/apply", {
            leaveType: "Sick Leave",
            fromDate: "2026-11-20",
            toDate: "2026-11-21",
            reason: "Viral fever and rest prescribed"
        });
        assert(
            applyRes.status === 201 && applyRes.data.leave.totalDays === 2 && applyRes.data.leave.status === "Pending",
            "Leave application submitted with totalDays = 2 and status = Pending"
        );
        const leave1Id = applyRes.data.leave._id;

        // TEST 9: Student View Leave History
        console.log("\n9. Student Leave History Check");
        const histRes = await studentClient.get("/api/leaves/my-leaves");
        assert(
            histRes.status === 200 && histRes.data.leaves.some(l => l._id === leave1Id),
            "Submitted leave appears in student leave history"
        );

        // TEST 10: Staff Login
        console.log("\n10. Staff Login");
        const staffLoginRes = await staffClient.post("/api/auth/staff/login", {
            email: staffEmail,
            password: staffPassword
        });
        assert(staffLoginRes.status === 200 && staffLoginRes.data.role === "staff", "Staff logs in successfully");

        // TEST 11: Staff View All Applications
        console.log("\n11. Staff View All Applications");
        const staffAllRes = await staffClient.get("/api/leaves/all");
        assert(
            staffAllRes.status === 200 && staffAllRes.data.leaves.some(l => l._id === leave1Id),
            "Staff successfully retrieves all applications including student's leave"
        );

        // TEST 12: Staff Approve Leave & Leave Balance Deduction
        console.log("\n12. Staff Approve Leave & Balance Deduction Check");
        const approveRes = await staffClient.patch(`/api/leaves/${leave1Id}/status`, {
            status: "Approved",
            staffRemark: "Approved, take care"
        });
        assert(
            approveRes.status === 200 && approveRes.data.leave.status === "Approved",
            "Staff approves leave request"
        );

        // Check student balance after approval (used should be 2, remaining should be 10)
        const balAfterApprove = await studentClient.get("/api/leaves/balance");
        assert(
            balAfterApprove.status === 200 && balAfterApprove.data.usedLeave === 2 && balAfterApprove.data.remainingLeave === 10,
            "Student balance deducted: 2 used, 10 remaining"
        );

        // TEST 13: Student Apply for 2nd Leave (1 day) & Staff Reject
        console.log("\n13. Student Apply & Staff Reject (Balance should remain unchanged)");
        const apply2Res = await studentClient.post("/api/leaves/apply", {
            leaveType: "Casual Leave",
            fromDate: "2026-11-25",
            toDate: "2026-11-25",
            reason: "Personal event"
        });
        const leave2Id = apply2Res.data.leave._id;

        const rejectRes = await staffClient.patch(`/api/leaves/${leave2Id}/status`, {
            status: "Rejected",
            staffRemark: "Not permitted on this date"
        });
        assert(
            rejectRes.status === 200 && rejectRes.data.leave.status === "Rejected",
            "Staff rejects leave request"
        );

        // Verify balance after rejection did NOT change
        const balAfterReject = await studentClient.get("/api/leaves/balance");
        assert(
            balAfterReject.status === 200 && balAfterReject.data.usedLeave === 2 && balAfterReject.data.remainingLeave === 10,
            "Rejected leave does NOT deduct balance: used remains 2, remaining remains 10"
        );

        // TEST 14: Over-limit Leave Deduction Prevention
        console.log("\n14. Insufficient Leave Balance Prevention Check");
        // Student applies for 15 days (remaining is only 10)
        const applyOverlimitRes = await studentClient.post("/api/leaves/apply", {
            leaveType: "Casual Leave",
            fromDate: "2026-12-01",
            toDate: "2026-12-15",
            reason: "Long vacation"
        });
        const leave3Id = applyOverlimitRes.data.leave._id;

        // Staff tries to approve 15 days when only 10 remain
        const approveOverlimitRes = await staffClient.patch(`/api/leaves/${leave3Id}/status`, {
            status: "Approved",
            staffRemark: "Attempting to approve over-limit leave"
        });
        assert(
            approveOverlimitRes.status === 400 && approveOverlimitRes.data.success === false,
            "Approval rejected with 400 due to insufficient balance"
        );

        // TEST 15: Logout
        console.log("\n15. Student & Staff Logout");
        const logoutStudentRes = await studentClient.post("/api/auth/logout");
        const logoutStaffRes = await staffClient.post("/api/auth/logout");
        assert(
            logoutStudentRes.status === 200 && logoutStaffRes.status === 200,
            "Both student and staff logout successfully"
        );

        // Verify session is invalidated
        const postLogoutMe = await studentClient.get("/api/auth/me");
        assert(
            postLogoutMe.status === 401,
            "Accessing /api/auth/me after logout correctly returns 401 Unauthorized"
        );

    } finally {
        // Cleanup test data
        console.log("\n🧹 Cleaning up test artifacts from database...");
        const delLeaves = await Leave.deleteMany({ registerNumber: testStudent.registerNumber });
        const delStudent = await Student.deleteOne({ email: testStudent.email.toLowerCase() });
        console.log(`Cleaned up ${delLeaves.deletedCount} test leaves and ${delStudent.deletedCount} test student.`);

        // Close server and mongo connection
        await new Promise((resolve) => server.close(resolve));
        await mongoose.disconnect();
        console.log("Disconnected test server and database.");
    }

    console.log("\n=================================================");
    console.log(`🏁 TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log("=================================================");

    if (failedCount > 0) {
        process.exit(1);
    }
}

runTests().catch((err) => {
    console.error("Test execution threw error:", err);
    process.exit(1);
});
