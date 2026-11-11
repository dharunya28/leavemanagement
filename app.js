const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const session = require("express-session");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const { seedInitialStaff } = require("./scripts/createStaff");

dotenv.config();

const app = express();

// Trust reverse proxy in production (required for Render)
if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}

// Connect MongoDB and optionally seed initial staff if env variables are present
connectDB().then(() => {
    seedInitialStaff();
});

// Read incoming data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(
    session({
        secret: process.env.SESSION_SECRET || "student-leave-secret-key-fallback",
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 24 * 60 * 60 * 1000,
            httpOnly: true,
            sameSite: "lax",
            secure: "auto"
        }
    })
);

// Health check endpoint for Render deployment monitoring
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is healthy",
        timestamp: new Date().toISOString()
    });
});

// Connect authentication APIs
app.use("/api/auth", authRoutes);

// Connect leave management APIs
app.use("/api/leaves", leaveRoutes);

// Load frontend files (support both .html extension and clean routes)
app.use(express.static(path.join(__dirname, "public"), { extensions: ["html"] }));

// Home page route
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
