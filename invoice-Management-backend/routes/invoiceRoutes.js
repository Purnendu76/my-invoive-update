import { Router } from "express";
import db from "../db/db_connect.js";
import { invoices } from "../db/schema.js";
import { buildInvoicePayload } from "../helpers/invoiceHelpers.js";
import { calculateInvoiceTotals } from "../helpers/invoiceCalculations.js";
import { eq } from "drizzle-orm";
import upload from "../middleware/upload.js";

const router = Router();

/**
 * ✅ Create Invoice
 */
router.post("/", upload.single("document"), async (req, res) => {
  try {
    let invoiceData = buildInvoicePayload(req);
    invoiceData = calculateInvoiceTotals(invoiceData);
    if (req.file) {
      invoiceData.document_path = req.file.path;
    }
    const [newInvoice] = await db
      .insert(invoices)
      .values(invoiceData)
      .returning();
    res.status(201).json({ message: "Invoice created", invoice: newInvoice });
  } catch (error) {
    console.error("❌ Create invoice error:", error);
    res.status(500).json({ error: "Failed to create invoice" });
  }
});

/**
 * ✅ Get All Invoices
 */
router.get("/", async (req, res) => {
  try {
    const allInvoices = await db.select().from(invoices);
    res.json(allInvoices);
  } catch (error) {
    console.error("❌ Get invoices error:", error);
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
});

/**
 * ✅ Get Single Invoice
 */
router.get("/:id", async (req, res) => {
  try {
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, req.params.id));

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    res.json(invoice);
  } catch (error) {
    console.error("❌ Get invoice error:", error);
    res.status(500).json({ error: "Failed to fetch invoice" });
  }
});

/**
 * ✅ Update Invoice
 */
router.put("/:id", async (req, res) => {
  try {
    let invoiceData = buildInvoicePayload(req);
    invoiceData = calculateInvoiceTotals(invoiceData);
    delete invoiceData.id; // avoid overwriting primary key

    const [updatedInvoice] = await db
      .update(invoices)
      .set(invoiceData)
      .where(eq(invoices.id, req.params.id))
      .returning();

    if (!updatedInvoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    res.json({ message: "Invoice updated", invoice: updatedInvoice });
  } catch (error) {
    console.error("❌ Update invoice error:", error);
    res.status(500).json({ error: "Failed to update invoice" });
  }
});

/**
 * ✅ Delete Invoice
 */
router.delete("/:id", async (req, res) => {
  try {
    const [deletedInvoice] = await db
      .delete(invoices)
      .where(eq(invoices.id, req.params.id))
      .returning();

    if (!deletedInvoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    res.json({ message: "Invoice deleted", invoice: deletedInvoice });
  } catch (error) {
    console.error("❌ Delete invoice error:", error);
    res.status(500).json({ error: "Failed to delete invoice" });
  }
});

export default router;
