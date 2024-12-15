// Import necessary modules
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx"); // For CommonJS
import XLSX from "xlsx";     // For ES Modules


// Constants
const PORT = process.env.PORT || 5001;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "password";

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Path to database file
const dbPath = path.join(__dirname, "db.json");

// Ensure db.json exists
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify([]));
}

// Helper functions to read and write from db.json
const readDatabase = () => JSON.parse(fs.readFileSync(dbPath, "utf8"));
const writeDatabase = (data) => fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

// Routes
app.get("/", (req, res) => res.send("Backend is running!"));

// Registration endpoint
app.post("/api/registrations", (req, res) => {
  const {
    name,
    gender,
    email,
    age,
    school,
    stateOfOrigin,
    nationality,
    talentCategory,
    localGovernment,
    instagramHandle,
    facebookHandle,
    phoneNumber,
    stageName,
  } = req.body;

  // Validation checks
  if (
    !name ||
    !gender ||
    !email ||
    !age ||
    !talentCategory ||
    !school ||
    !stateOfOrigin ||
    !nationality ||
    !localGovernment ||
    !instagramHandle ||
    !facebookHandle ||
    !phoneNumber ||
    !stageName
  ) {
    return res.status(400).json({ message: "Please fill out all required fields." });
  }

  const db = readDatabase();
  db.push(req.body);
  writeDatabase(db);

  res.status(201).json({ message: "Registration successful!" });
});

// Admin login endpoint
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    return res.status(200).json({ message: "Login successful!", token: "admin-token" });
  }

  res.status(401).json({ message: "Invalid credentials." });
});

// Fetch registrations (admin only)
app.get("/api/admin/registrations", (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || authHeader !== "Bearer admin-token") {
    return res.status(403).json({ message: "Unauthorized." });
  }

  const db = readDatabase();
  res.status(200).json(db);
});

// Export registrations as CSV or Excel (admin only)
app.get("/api/admin/registrations/export/:format", (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || authHeader !== "Bearer admin-token") {
    return res.status(403).json({ message: "Unauthorized." });
  }

  const { format } = req.params;
  const db = readDatabase();

  if (format === "csv") {
    const csvData = db.map((entry) =>
      Object.values(entry)
        .map((value) => `"${value}"`)
        .join(",")
    );
    const csvHeader = Object.keys(db[0]).join(",") + "\n";
    const csvContent = csvHeader + csvData.join("\n");

    res.setHeader("Content-Disposition", "attachment; filename=registrations.csv");
    res.setHeader("Content-Type", "text/csv");
    res.status(200).send(csvContent);
  } else if (format === "xlsx") {
    const xlsx = require("xlsx");
    const xlsData = xlsx(db);
    res.setHeader("Content-Disposition", "attachment; filename=registrations.xlsx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.status(200).send(xlsData);
  } else {
    res.status(400).json({ message: "Invalid export format. Use 'csv' or 'xlsx'." });
  }
});

// Start the server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
