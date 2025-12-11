import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import userInvoiceRoutes from "./routes/userInvoiceRoutes.js"; 
import authRoutes from "./routes/authRoutes.js"; 
import projectRoutes from "./routes/projectRoutes.js";
import projectModeRoutes from "./routes/projectModeRoutes.js";
import statesRoutes from "./routes/statesRoutes.js";
import { authMiddleware } from "./authMiddleware.js";
import { authorizeRoles } from "./authorizeRoles.js";

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3000;

// ✅ Middleware
app.use(cors());
app.use(express.json());
// simple request logger
app.use((req, res, next) => {
  try {
    console.log(`[request] ${req.method} ${req.url}`);
  } catch (e) {
    // ignore logging errors
  }
  next();
});

// ✅ Auth routes (no middleware here)
app.use("/api/v1/auth", authRoutes);

// ✅ Admin invoices (only Admins)
app.use(
  "/api/v1/invoices",
  authMiddleware,
  authorizeRoles("Admin"),
  invoiceRoutes
);

// ✅ User invoices (Users + Admins can access)
app.use(
  "/api/v1/user-invoices",
  authMiddleware,
  authorizeRoles("user", "Admin"),
  userInvoiceRoutes
);


// ✅ Projects (Admins only)
app.use(
  "/api/v1/projects",
  authMiddleware,
  authorizeRoles("Admin"),
  projectRoutes
);

// ✅ Project Modes (Admins only)
app.use(
  "/api/v1/project-modes",
  authMiddleware,
  authorizeRoles("Admin"),
  projectModeRoutes
);

// ✅ States (Admins only)
app.use(
  "/api/v1/states",
  authMiddleware,
  authorizeRoles("Admin"),
  statesRoutes
);


// ✅ Root route
app.get("/", (req, res) => {
  res.send("🚀 Invoice API is running...");
});

// ✅ Start server
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

app.listen(5000, "localhost", () => {
  console.log(`🚀 Server running at http://localhost:5000`);
});
