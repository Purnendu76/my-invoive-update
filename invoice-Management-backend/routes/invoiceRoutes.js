
import fs from "fs";
import path from "path";
import { Router } from "express";
import db from "../db/db_connect.js";
import { invoices } from "../db/schema.js";
import { buildInvoicePayload } from "../helpers/invoiceHelpers.js";
import { calculateInvoiceTotals } from "../helpers/invoiceCalculations.js";
import { eq } from "drizzle-orm";
import upload from "../middleware/upload.js";

import multer from "multer";
const multiUpload = upload.fields([
  { name: "invoiceCopy", maxCount: 1 },
  { name: "proofOfSubmission", maxCount: 1 },
  { name: "supportingDocs", maxCount: 1 },
]);

const router = Router();

/**
 * ✅ Update Invoice (Admin)
 */
router.put("/:id", multiUpload, async (req, res) => {
  try {
    let invoiceData = buildInvoicePayload(req);
    invoiceData = calculateInvoiceTotals(invoiceData);
    delete invoiceData.id;
    // Save file paths if uploaded
    if (req.files) {
      if (req.files.invoiceCopy && req.files.invoiceCopy[0]) {
        invoiceData.invoice_copy_path = req.files.invoiceCopy[0].path;
      }
      if (req.files.proofOfSubmission && req.files.proofOfSubmission[0]) {
        invoiceData.proof_of_submission_path = req.files.proofOfSubmission[0].path;
      }
      if (req.files.supportingDocs && req.files.supportingDocs[0]) {
        invoiceData.supporting_docs_path = req.files.supportingDocs[0].path;
      }
    }
    const [updatedInvoice] = await db
      .update(invoices)
      .set(invoiceData)
      .where(eq(invoices.id, req.params.id))
      .returning();
    if (!updatedInvoice) return res.status(404).json({ error: "Invoice not found" });
    res.json({ message: "Invoice updated", invoice: updatedInvoice });
  } catch (error) {
    console.error("❌ Update invoice error:", error);
    res.status(500).json({ error: "Failed to update invoice" });
  }
});




/**
 * ✅ Get All Invoices (Admin)
 */
router.get("/", async (req, res) => {
  try {
    const allInvoices = await db.select().from(invoices);
    res.json(allInvoices);
  } catch (error) {
    console.error("❌ Get all invoices error:", error);
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
});

/**
 * ✅ Create Invoice
 */
router.post("/", multiUpload, async (req, res) => {
  try {
    let invoiceData = buildInvoicePayload(req);
    invoiceData = calculateInvoiceTotals(invoiceData);
    // Save file paths if uploaded
    if (req.files) {
      if (req.files.invoiceCopy && req.files.invoiceCopy[0]) {
        invoiceData.invoice_copy_path = req.files.invoiceCopy[0].path;
      }
      if (req.files.proofOfSubmission && req.files.proofOfSubmission[0]) {
        invoiceData.proof_of_submission_path = req.files.proofOfSubmission[0].path;
      }
      if (req.files.supportingDocs && req.files.supportingDocs[0]) {
        invoiceData.supporting_docs_path = req.files.supportingDocs[0].path;
      }
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
router.delete("/:id/file", async (req, res) => {
  try {
    const type = req.query.type;
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, req.params.id));
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }
    let fileField = null;
    if (type === "invoiceCopy") fileField = "invoice_copy_path";
    else if (type === "proofOfSubmission") fileField = "proof_of_submission_path";
    else if (type === "supportingDocs") fileField = "supporting_docs_path";
    else return res.status(400).json({ error: "Invalid file type" });
    const filePath = invoice[fileField];
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    const [updatedInvoice] = await db
      .update(invoices)
      .set({ [fileField]: null })
      .where(eq(invoices.id, req.params.id))
      .returning();
    res.json({ message: "File removed", invoice: updatedInvoice });
  } catch (error) {
    console.error("❌ Remove invoice file error:", error);
    res.status(500).json({ error: "Failed to remove file" });
  }
});
//       .where(eq(invoices.id, req.params.id))
//       .returning();

//     if (!updatedInvoice) {
//       return res.status(404).json({ error: "Invoice not found" });
//     }

//     res.json({ message: "Invoice updated", invoice: updatedInvoice });
//   } catch (error) {
//     console.error("❌ Update invoice error:", error);
//     res.status(500).json({ error: "Failed to update invoice" });
//   }
// });






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
