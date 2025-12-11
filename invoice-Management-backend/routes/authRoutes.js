import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";

const router = Router();

// -------------------------------
// REGISTER → Create new user
// -------------------------------
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, project_role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const existing = await db.select().from(users).where(eq(users.email, email));
    if (existing.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [newUser] = await db
      .insert(users)
      .values({
        user_name: name,
        email,
        password: hashedPassword,
        role: role || "Admin",
        project_role: project_role || null,
      })
      .returning();

    const token = jwt.sign(
      {
        id: newUser.id,
        name: newUser.user_name,
        email: newUser.email,
        role: newUser.role,
        projectRole: newUser.project_role,
      },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1d" }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        name: newUser.user_name,
        email: newUser.email,
        role: newUser.role,
        projectRole: newUser.project_role,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// -------------------------------
// LOGIN → Authenticate user
// -------------------------------
router.post("/login", async (req, res) => {
  try {
    console.log("[authRoutes] POST /login hit — body:", req.body);
    const { email, password } = req.body;

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        name: user.user_name,
        email: user.email,
        role: user.role,
        projectRole: user.project_role,
      },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.user_name,
        email: user.email,
        role: user.role,
        projectRole: user.project_role,
      },
    });
  } catch (error) {
    // Log full error stack for debugging
    console.error("Login error:", error && error.stack ? error.stack : error);
    // Prevent process exit by sending error response only
    res.status(500).json({ message: "Server error", error: error && error.message ? error.message : error });
  }
});

// -------------------------------
// GET /me → Get currently logged-in user
// -------------------------------
router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.id))
      .limit(1);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      id: user.id,
      name: user.user_name,
      email: user.email,
      role: user.role,
      projectRole: user.project_role,
    });
  } catch (error) {
    console.error("Fetch current user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// -------------------------------
// GET /register → Get all users
// -------------------------------
router.get("/register", async (req, res) => {
  try {
    const allUsers = await db.select().from(users);
    res.json(allUsers);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// -------------------------------
// DELETE /register/:id → Delete user
// -------------------------------
router.delete("/register/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await db.delete(users).where(eq(users.id, id)).returning();

    if (deleted.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully", user: deleted[0] });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// -------------------------------
// PUT /register/:id → Update project_role
// -------------------------------
router.put("/register/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { project_role } = req.body;

    if (!project_role) {
      return res.status(400).json({ message: "project_role is required" });
    }

    const allowedRoles = ["NFS", "GAIL", "BGCL", "STP", "BHARAT NET", "NFS AMC"];
    if (!allowedRoles.includes(project_role)) {
      return res.status(400).json({ message: "Invalid project role" });
    }

    const [updatedUser] = await db
      .update(users)
      .set({ project_role })
      .where(eq(users.id, id))
      .returning();

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Project role updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Update project role error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
