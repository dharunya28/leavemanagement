
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

const isProduction = process.env.NODE_ENV === "production";

// Trust Render proxy
if (isProduction) {
    app.set("trust proxy", 1);
}

// =====================================
// CORS CONFIGURATION
// =====================================

const allowedOrigins = [
    "https://dharunya28.github.io",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:3000",
    "http://localhost:5173"
];

app.use((req, res, next) => {
    const origin = req.headers.origin;

    if (origin && allowedOrigins.includes(origin)) {
        res.header("Access-Control-Allow-Origin", origin);
        res.header("Access-Control-Allow-Credentials", "true");
        res.header(
            "Access-Control-Allow-Methods",
            "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        );
        res.header(
            "Access-Control-Allow-Headers",
            "Content-Type, Authorization"
        );
    }

    res.header("Vary", "Origin");

    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }

    next();
});

// =====================================
// BODY PARSING
// =====================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =====================================
// SESSION CONFIGURATION
// =====================================

app.use(
    session({
        secret:
            process.env.SESSION_SECRET ||
            "student-leave-secret-key-fallback",

        resave: false,
        saveUninitialized: false,

        cookie: {
            maxAge: 24 * 60 * 60 * 1000,
            httpOnly: true,
            sameSite: isProduction ? "none" : "lax",
            secure: isProduction
        }
    })
);

// =====================================
// HEALTH CHECK
// =====================================

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is healthy",
        timestamp: new Date().toISOString()
    });
});

// =====================================
// API ROUTES
// =====================================

app.use("/api/auth", authRoutes);
app.use("/api/leaves", leaveRoutes);

// =====================================
// FRONTEND STATIC FILES
// =====================================

app.use(
    express.static(path.join(__dirname, "public"), {
        extensions: ["html"]
    })
);

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// =====================================
// DATABASE CONNECTION & STAFF SETUP
// =====================================

connectDB()
    .then(async () => {
        console.log("MongoDB connected successfully");

        await seedInitialStaff();

        console.log("Initial staff setup completed");
    })
    .catch((error) => {
        console.error("Database or staff setup error:", error);
    });

// =====================================
// START SERVER
// =====================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
