import { Router } from "express";
import db from "../db/db_connect.js";
import { invoices } from "../db/schema.js";
import { buildInvoicePayload } from "../helpers/invoiceHelpers.js";
import { calculateInvoiceTotals } from "../helpers/invoiceCalculations.js";
import { eq, inArray } from "drizzle-orm";
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
    const { state_ids } = req.query;
    let invoicesResult = [];
    let projectIds = [];
    if (state_ids) {
      // Parse state_ids from query (comma-separated or array)
      let stateIdArr = Array.isArray(state_ids) ? state_ids : String(state_ids).split(",").map(s => s.trim()).filter(Boolean);
      if (stateIdArr.length > 0) {
        // Find all project_ids that have any of these states
        const projectStatesRows = await db.select().from(require("../db/schema.js").project_states).where(inArray(require("../db/schema.js").project_states.state_id, stateIdArr));
        projectIds = [...new Set(projectStatesRows.map(ps => ps.project_id))];
        if (projectIds.length > 0) {
          invoicesResult = await db.select().from(invoices).where(inArray(invoices.project, projectIds));
        }
      }
    } else {
      invoicesResult = await db.select().from(invoices);
      projectIds = invoicesResult.map(inv => inv.project);
    }
    // Attach states to each invoice
    let statesMap = {};
    if (projectIds.length > 0) {
      const projectStatesRows = await db.select().from(require("../db/schema.js").project_states).where(inArray(require("../db/schema.js").project_states.project_id, projectIds));
      const stateIds = projectStatesRows.map(ps => ps.state_id);
      const allStates = stateIds.length > 0 ? await db.select().from(require("../db/schema.js").states).where(inArray(require("../db/schema.js").states.id, stateIds)) : [];
      const stateObjMap = {};
      allStates.forEach(s => { stateObjMap[s.id] = s; });
      projectStatesRows.forEach(ps => {
        if (!statesMap[ps.project_id]) statesMap[ps.project_id] = [];
        if (stateObjMap[ps.state_id]) statesMap[ps.project_id].push({ id: ps.state_id, name: stateObjMap[ps.state_id].name });
      });
    }
    const invoicesWithStates = invoicesResult.map(inv => ({ ...inv, states: statesMap[inv.project] || [] }));
    res.json(invoicesWithStates);
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
