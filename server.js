require("dotenv").config();

const express = require("express");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const path = require("path");
const db = require("./database");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

if (
  !process.env.SESSION_SECRET ||
  process.env.SESSION_SECRET.length < 32
) {
  throw new Error("Set a SESSION_SECRET of at least 32 characters");
}

app.use(session({
  name: "research.sid",
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 60 * 60 * 1000
  }
}));

app.use(express.static(path.join(__dirname, "public")));

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({
      message: "Authentication required"
    });
  }
  next();
}

app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (
      !cleanName ||
      cleanName.length > 100 ||
      cleanEmail.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {
      return res.status(400).json({
        message: "Invalid name or email"
      });
    }

    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({
        message: "Password must contain 8 to 72 characters"
      });
    }

    const existing = db.prepare(
      "SELECT id FROM users WHERE email = ?"
    ).get(cleanEmail);

    if (existing) {
      return res.status(409).json({
        message: "Email already registered"
      });
    }

    const hash = await bcrypt.hash(password, 12);

    const result = db.prepare(`
      INSERT INTO users (name, email, password_hash)
      VALUES (?, ?, ?)
    `).run(cleanName, cleanEmail, hash);

    return res.status(201).json({
      message: "Registration successful",
      userId: Number(result.lastInsertRowid)
    });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({
        message: "Email already registered"
      });
    }

    console.error(error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        message: "Email and password required"
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const user = db.prepare(
      "SELECT * FROM users WHERE email = ?"
    ).get(cleanEmail);

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const valid = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!valid) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    req.session.regenerate((error) => {
      if (error) {
        return res.status(500).json({
          message: "Session creation failed"
        });
      }

      req.session.userId = user.id;

      req.session.save((saveError) => {
        if (saveError) {
          return res.status(500).json({
            message: "Session save failed"
          });
        }

        return res.json({
          message: "Login successful",
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        });
      });
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
});

app.get("/api/me", requireAuth, (req, res) => {
  const user = db.prepare(`
    SELECT id, name, email, role
    FROM users WHERE id = ?
  `).get(req.session.userId);

  if (!user) {
    return res.status(401).json({
      message: "Account no longer available"
    });
  }

  return res.json({ user });
});

app.get("/api/projects", requireAuth, (req, res) => {
  const projects = db.prepare(`
    SELECT id, title, description
    FROM projects
    WHERE owner_id = ?
    ORDER BY id DESC
  `).all(req.session.userId);

  return res.json({ projects });
});

app.post("/api/projects", requireAuth, (req, res) => {
  const { title, description } = req.body || {};

  if (
    typeof title !== "string" ||
    typeof description !== "string" ||
    !title.trim() ||
    !description.trim() ||
    title.length > 150 ||
    description.length > 2000
  ) {
    return res.status(400).json({
      message: "Valid title and description required"
    });
  }

  const result = db.prepare(`
    INSERT INTO projects (title, description, owner_id)
    VALUES (?, ?, ?)
  `).run(
    title.trim(),
    description.trim(),
    req.session.userId
  );

  return res.status(201).json({
    message: "Project created",
    projectId: Number(result.lastInsertRowid)
  });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      return res.status(500).json({
        message: "Logout failed"
      });
    }

    res.clearCookie("research.sid");

    return res.json({
      message: "Logout successful"
    });
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Research Portal running on port ${PORT}`);
});