// routes/userInvoiceRoutes.js
import { Router } from "express";
import db from "../db/db_connect.js";
import { invoices, users } from "../db/schema.js";
import { buildInvoicePayload } from "../helpers/invoiceHelpers.js";
import { calculateInvoiceTotals } from "../helpers/invoiceCalculations.js";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "../authMiddleware.js";
import upload from "../middleware/upload.js";

const router = Router();

// create (attach logged-in user)
router.post("/", authMiddleware, async (req, res) => {
  try {
    let invoiceData = buildInvoicePayload(req);
    invoiceData = calculateInvoiceTotals(invoiceData);

    // IMPORTANT: property name must match your schema (see note below)
    invoiceData.userId = req.user.id;

    const [newInvoice] = await db.insert(invoices).values(invoiceData).returning();
    res.status(201).json({ message: "Invoice created", invoice: newInvoice });
  } catch (error) {
    console.error("Create invoice error:", error);
    res.status(500).json({ error: "Failed to create invoice" });
  }
});

// get all for logged-in user
router.get("/", async (req, res) => {
  try {

    const allInvoices = await db
      .select()
      .from(invoices)
      .where(eq(invoices.userId, req.user.id)); 
    res.json(allInvoices);
  } catch (error) {
    console.error("Get invoices error:", error);
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
});

// GET /project  — Admin: all invoices for project; user: only their invoices for project
router.get("/project", async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    console.log("user-invoices: req.user =", user);
    console.log("user.project:", user.project);

    let allInvoices;

    if (user.role === "Admin") {
      // Admin: include invoice + creator info (join on userId -> users.id)
      allInvoices = await db
        .select({ invoice: invoices, user: users })
        .from(invoices)
        .leftJoin(users, eq(invoices.userId, users.id))
        .where(eq(invoices.project, user.projectRole));
    } else {
      // Regular user: only invoices created by this user within same project
      allInvoices = await db
        .select()
        .from(invoices)
        .where(and(eq(invoices.project, user.projectRole), eq(invoices.userId, user.id)));
    }
    res.json(allInvoices);
    console.log("found invoices count:", Array.isArray(allInvoices) ? allInvoices.length : 0);
    // send a single JSON response (easy for frontend to consume)
    // return res.status(200).json({ user, invoices: allInvoices });
  } catch (error) {
    console.error("Get invoices error:", error);
    return res.status(500).json({ error: "Failed to fetch invoices" });
  }
});

// get single (owner only)
router.get("/:id", async (req, res) => {
  try {
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, req.params.id), eq(invoices.userId, req.user.id)));
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });
    res.json(invoice);
  } catch (error) {
    console.error("Get invoice error:", error);
    res.status(500).json({ error: "Failed to fetch invoice" });
  }
});

// update (owner only)
router.put("/:id", upload.single("document"), async (req, res) => {
  try {
    let invoiceData = buildInvoicePayload(req);
    invoiceData = calculateInvoiceTotals(invoiceData);
    delete invoiceData.id;
    if (req.file) {
      invoiceData.document_path = req.file.path;
    }
    const [updatedInvoice] = await db
      .update(invoices)
      .set(invoiceData)
      .where(and(eq(invoices.id, req.params.id), eq(invoices.userId, req.user.id)))
      .returning();
    if (!updatedInvoice) return res.status(404).json({ error: "Invoice not found" });
    res.json({ message: "Invoice updated", invoice: updatedInvoice });
  } catch (error) {
    console.error("Update invoice error:", error);
    res.status(500).json({ error: "Failed to update invoice" });
  }
});

// delete (owner only)
router.delete("/:id", async (req, res) => {
  try {
    const [deletedInvoice] = await db
      .delete(invoices)
      .where(and(eq(invoices.id, req.params.id), eq(invoices.userId, req.user.id)))
      .returning();
    if (!deletedInvoice) return res.status(404).json({ error: "Invoice not found" });
    res.json({ message: "Invoice deleted", invoice: deletedInvoice });
  } catch (error) {
    console.error("Delete invoice error:", error);
    res.status(500).json({ error: "Failed to delete invoice" });
  }
});

export default router;
