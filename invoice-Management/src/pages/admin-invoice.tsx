import { useEffect, useRef, useState } from "react";
import {
  Table,
  TextInput,
  Group,
  Button,
  Modal,
  Text,
  Badge,
  Stack,
  ActionIcon,
  Loader,
  Title,
  Select,
  Progress,
  FileInput,
} from "@mantine/core";
import { DatePickerInput } from '@mantine/dates';
import { useDisclosure } from "@mantine/hooks";
import { IconSearch, IconPlus, IconEdit, IconTrash, IconDownload, IconEye, IconUpload } from "@tabler/icons-react";
import axios from "axios";
import InvoiceForm from "../components/InvoiceForm";
import InvoicePopup from "./InvoicePopup";
import type { Invoice } from "@/interface/Invoice";
import { modals } from "@mantine/modals";
import { notifySuccess, notifyError } from "../lib/utils/notify";
import Cookies from "js-cookie";
import { Link } from "react-router-dom";
import * as XLSX from "xlsx";

// Utility function to format date as '12 April 2025'
function formatDateToLong(dateInput: string | null | undefined): string {
  if (!dateInput) return "-";

  // dateInput = "YYYY-MM-DD"
  const [y, m, d] = dateInput.split("-").map(Number);
  if (!y || !m || !d) return "-";

  const date = new Date(y, m - 1, d); // 👈 LOCAL date (no timezone shift)

  return `${date.getDate()} ${date.toLocaleString("en-US", { month: "long" })} ${date.getFullYear()}`;
}


export default function Admin_invoice() {
  const [search, setSearch] = useState("");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);

  const [opened, { open, close }] = useDisclosure(false);

  // Infinite scroll
  const [visibleCount, setVisibleCount] = useState(20);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Import modal states
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importErrors, setImportErrors] = useState<string[]>([]);

  // Fetch invoices
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const token = Cookies.get("token");
      const res = await axios.get("/api/v1/invoices", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const normalized = (res.data || []).map((inv: Invoice) => ({
        ...inv,
        invoiceDate: inv.invoiceDate ?? null,
        submissionDate: inv.submissionDate ?? null,
        paymentDate: inv.paymentDate ?? null,
      }));


      setInvoices(normalized);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      notifyError("Failed to fetch invoices. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Delete invoice
  const handleDelete = (id: string) => {
    modals.openConfirmModal({
      title: "Delete invoice",
      centered: true,
      children: <Text size="sm">Are you sure you want to delete this invoice?</Text>,
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          const token = Cookies.get("token");
          await axios.delete(`/api/v1/invoices/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setInvoices((prev) => prev.filter((inv) => inv.id !== id));
          notifySuccess("Invoice deleted successfully");
        } catch (error) {
          console.error("Error deleting invoice:", error);
          notifyError("Failed to delete invoice. Please try again.");
        }
      },
    });
  };

  const handleEdit = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    open();
  };

  const handleNew = () => {
    setSelectedInvoice(null);
    open();
  };

  // Build unique project options
  const projectOptions = Array.from(
    new Set(
      invoices.flatMap((inv) =>
        Array.isArray(inv.project) ? inv.project : inv.project ? [inv.project] : []
      )
    )
  ).map((p) => ({ value: p as string, label: p as string }));

  const statusOptions = [
    { value: "Paid", label: "Paid" },
    { value: "Cancelled", label: "Cancelled" },
    { value: "Under process", label: "Under process" },
    { value: "Credit Note Issued", label: "Credit Note Issued" },
  ];

  // Filter invoices: show all by default, filter by project/status/date if selected
  const filteredInvoices = (invoices || []).filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
      inv.status?.toLowerCase().includes(search.toLowerCase());

    // Only filter by project if projectFilter is set
    const matchesProject = projectFilter
      ? (Array.isArray(inv.project)
          ? inv.project.some((p) => p.toLowerCase() === projectFilter.toLowerCase())
          : inv.project?.toLowerCase() === projectFilter.toLowerCase())
      : true;

    const matchesStatus = !statusFilter || inv.status?.toLowerCase() === statusFilter.toLowerCase();

    // Date range filter
    let matchesDate = true;
    if (dateRange[0] && dateRange[1]) {
      const invDate = inv.invoiceDate instanceof Date ? inv.invoiceDate : inv.invoiceDate ? new Date(inv.invoiceDate) : null;
      if (!invDate || isNaN(invDate)) return false;
      const start = new Date(dateRange[0]);
      start.setHours(0,0,0,0);
      const end = new Date(dateRange[1]);
      end.setHours(23,59,59,999);
      if (invDate < start || invDate > end) matchesDate = false;
    }

    return matchesSearch && matchesProject && matchesStatus && matchesDate;
  });

// Export currently filtered invoices with ALL fields as XLSX
const handleExport = () => {
  try {
    const exportData = (filteredInvoices || []).map((inv) => ({
      // Core identifiers
      // "ID": inv.id ?? "",
      // "User ID": inv.userId ?? "",

      // Project metadata
      "Project": Array.isArray(inv.project) ? inv.project.join(", ") : inv.project ?? "",
      "Mode of Project": inv.modeOfProject ?? "",
      "State": inv.state ?? "",
      "MyBill Category": inv.mybillCategory ?? "",
      "Milestone": inv.milestone ?? "",

      // Invoice details
      "Invoice Number": inv.invoiceNumber ?? "",
      "Invoice Date": inv.invoiceDate ? formatDateToLong(inv.invoiceDate) : "",
      "Submission Date": inv.submissionDate ? formatDateToLong(inv.submissionDate) : "",

      // Amounts & GST
      "Invoice Basic Amount": inv.invoiceBasicAmount ?? 0,
      "GST Percentage": inv.gstPercentage ?? "",
      "Invoice GST Amount": inv.invoiceGstAmount ?? 0,
      "Total Amount": inv.totalAmount ?? 0,

      // Client & deductions
      "Passed Amount By Client": inv.passedAmountByClient ?? 0,
      "Retention": inv.retention ?? 0,
      "GST Withheld": inv.gstWithheld ?? 0,
      "TDS": inv.tds ?? 0,
      "GST TDS": inv.gstTds ?? 0,
      "BOCW": inv.bocw ?? 0,
      "Low Depth Deduction": inv.lowDepthDeduction ?? 0,
      "LD": inv.ld ?? 0,
      "SLA Penalty": inv.slaPenalty ?? 0,
      "Penalty": inv.penalty ?? 0,
      "Other Deduction": inv.otherDeduction ?? 0,

      // Totals
      "Total Deduction": inv.totalDeduction ?? 0,
      "Net Payable": inv.netPayable ?? 0,

      // Payment info
      "Status": inv.status ?? "",
      "Amount Paid By Client": inv.amountPaidByClient ?? 0,
      "Payment Date": inv.paymentDate ? formatDateToLong(inv.paymentDate) : "",
      "Balance": inv.balance ?? 0,

      // Misc
      "Remarks": inv.remarks ?? "",

      // File paths
      "Invoice Copy Path": inv.invoice_copy_path ?? "",
      "Proof Of Submission Path": inv.proof_of_submission_path ?? "",
      "Supporting Docs Path": inv.supporting_docs_path ?? "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Invoices");

    const filename = `invoices_full_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);

    notifySuccess(`Exported ${exportData.length} invoice(s)`);
  } catch (error) {
    console.error("Export failed", error);
    notifyError("Failed to export invoices");
  }
};


  // Infinite scroll effect
  useEffect(() => {
    if (!loadMoreRef.current) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setVisibleCount((prev) => prev + 20);
      }
    });

    observer.observe(loadMoreRef.current);

    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      if (loadMoreRef.current) observer.unobserve(loadMoreRef.current);
    };
  }, [filteredInvoices]);

  const visibleInvoices = (filteredInvoices || []).slice(0, visibleCount);

  // Format money values: always show 2 decimal places, and never display negative values
  const formatMoney = (val: number | null | undefined): string => {
    const n = Number(val ?? 0);
    if (isNaN(n) || n <= 0) return "0.00";
    return n.toFixed(2);
  };

  // Helper to map spreadsheet header to expected payload key
const mapHeaderToKey = (h: string) => {
  const key = h.toLowerCase().trim();

  const map: Record<string, string> = {
    "project": "project",
    "mode of project": "modeOfProject",
    "state": "state",
    "mybill category": "mybillCategory",
    "milestone": "milestone",

    "invoice number": "invoiceNumber",
    "invoice date": "invoiceDate",
    "submission date": "submissionDate",

    "invoice basic amount": "invoiceBasicAmount",
    "gst percentage": "gstPercentage",
    "invoice gst amount": "invoiceGstAmount",
    "total amount": "totalAmount",

    "passed amount by client": "passedAmountByClient",
    "retention": "retention",
    "gst withheld": "gstWithheld",
    "tds": "tds",
    "gst tds": "gstTds",
    "bocw": "bocw",
    "low depth deduction": "lowDepthDeduction",
    "ld": "ld",
    "sla penalty": "slaPenalty",
    "penalty": "penalty",
    "other deduction": "otherDeduction",

    "total deduction": "totalDeduction",
    "net payable": "netPayable",

    "status": "status",
    "amount paid by client": "amountPaidByClient",
    "payment date": "paymentDate",
    "balance": "balance",

    "remarks": "remarks",
    "invoice copy path": "invoice_copy_path",
    "proof of submission path": "proof_of_submission_path",
    "supporting docs path": "supporting_docs_path",
  };

  return map[key] ?? null;
};

const parseExcelDate = (val: any): string | null => {
  if (!val) return null;

  // 1️⃣ Excel serial number (SAFE)
  if (typeof val === "number") {
    const d = XLSX.SSF.parse_date_code(val);
    if (!d) return null;
    return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
  }

  // 2️⃣ Text date like "4 December 2025" (NO TIMEZONE)
  if (typeof val === "string") {
    const parts = val.trim().split(" ");
    if (parts.length !== 3) return null;

    const day = Number(parts[0]);
    const year = Number(parts[2]);

    const monthMap: Record<string, number> = {
      january: 1,
      february: 2,
      march: 3,
      april: 4,
      may: 5,
      june: 6,
      july: 7,
      august: 8,
      september: 9,
      october: 10,
      november: 11,
      december: 12,
    };

    const month = monthMap[parts[1].toLowerCase()];
    if (!day || !month || !year) return null;

    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  return null;
};


  // Convert a row object (from XLSX utils) to a payload object expected by backend
  // const mapRowToPayload = (row: Record<string, any>) => {
  //   const payload: Record<string, any> = {};
  //   for (const rawKey of Object.keys(row)) {
  //     const key = mapHeaderToKey(rawKey);
  //     let val = row[rawKey];
  //     if (val === undefined || val === null) continue;

  //     // Trim strings
  //     if (typeof val === 'string') val = val.trim();

  //     // Parse dates if the mapped key represents a date
  //     if (['invoiceDate', 'submissionDate', 'paymentDate'].includes(key)) {
  //       const d = new Date(val);
  //       if (!isNaN(d.getTime())) payload[key] = d.toISOString();
  //       else payload[key] = null;
  //       continue;
  //     }

  //     // Parse numeric fields
  //     if (['basicAmount','gstAmount','totalAmount','totalDeduction','netPayable','amountPaidByClient','balance'].includes(key)) {
  //       const n = Number(String(val).replace(/[^0-9.-]+/g, ''));
  //       payload[key] = isNaN(n) ? 0 : n;
  //       continue;
  //     }

  //     // Project: if comma separated, convert to array
  //     if (key === 'project') {
  //       if (typeof val === 'string' && val.includes(',')) {
  //         payload.project = val.split(',').map((s: string) => s.trim()).filter(Boolean);
  //       } else {
  //         payload.project = val;
  //       }
  //       continue;
  //     }

  //     payload[key] = val;
  //   }
  //   return payload;
  // };

  // Create FormData for a single invoice payload (no file attachments from CSV/XLSX)
  const createFormDataFromPayload = (payload: Record<string, any>) => {
    const form = new FormData();
    for (const [k, v] of Object.entries(payload)) {
      if (v === undefined || v === null) continue;
      // If it's an array, send as JSON string
      if (Array.isArray(v)) form.append(k, JSON.stringify(v));
      else form.append(k, String(v));
    }
    return form;
  };

// ✅ Helper to get logged-in user's userId from cookie or JWT
const getLoggedInUserId = (): string | null => {
  // 1️⃣ Try cookie first (recommended if you already store it)
  const cookieUserId =
    Cookies.get("userId") ||
    Cookies.get("user_id");

  if (cookieUserId) return cookieUserId;

  // 2️⃣ Fallback: decode JWT token
  const token = Cookies.get("token");
  if (!token) return null;

  try {
    const base64Payload = token.split(".")[1];
    const payload = JSON.parse(
      atob(base64Payload.replace(/-/g, "+").replace(/_/g, "/"))
    );

    return (
      payload.userId ||
      payload.user_id ||
      payload.sub ||   // common JWT field
      payload.id ||
      null
    );
  } catch (err) {
    console.error("Failed to decode token", err);
    return null;
  }
};


const handleImport = async () => {
  if (!file) return notifyError("Please select a file");

  const userId = getLoggedInUserId();
  if (!userId) return notifyError("Please re-login");

  setImporting(true);
  setImportErrors([]);

  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });

    setImportProgress({ current: 0, total: rows.length });

    const token = Cookies.get("token");
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const raw = rows[i];
      const payload: any = { userId };

      for (const col in raw) {
        const key = mapHeaderToKey(col);
        if (!key) continue;

        let val = raw[col];

        if (["invoiceDate", "submissionDate", "paymentDate"].includes(key)) {
          payload[key] = parseExcelDate(val);
          continue;
        }

        if (typeof val === "string") val = val.trim();

        if (typeof val === "number") payload[key] = val;
        else if (val === "") payload[key] = null;
        else payload[key] = val;
      }

      try {
        const form = new FormData();
        Object.entries(payload).forEach(([k, v]) => {
          if (v !== null && v !== undefined) form.append(k, String(v));
        });

        await axios.post("/api/v1/invoices", form, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setImportProgress(p => ({ ...p, current: p.current + 1 }));
      } catch (e: any) {
        errors.push(`Row ${i + 1}: ${e.message}`);
      }
    }

    setImportErrors(errors);

    errors.length
      ? notifyError(`${errors.length} row(s) failed`)
      : notifySuccess("Invoices imported successfully");

    await fetchInvoices();
  } catch (err) {
    notifyError("Import failed");
    console.error(err);
  } finally {
    setImporting(false);
    setFile(null);
    setImportModalOpen(false);
    setImportProgress({ current: 0, total: 0 });
  }
};




  return (
    <Stack>
      <Stack gap="xs" mb="md">
        <Title order={2}>Admin Invoice</Title>
        <Text c="dimmed" size="sm">
          Manage, track, and update invoices from this dashboard.
        </Text>
      </Stack>


      <Group justify="space-between">
        <Group gap="sm">
          <TextInput
            placeholder="Search invoices..."
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            style={{ width: "220px" }}
          />
          <Select
            placeholder="Filter by project"
            value={projectFilter}
            onChange={setProjectFilter}
            data={projectOptions}
            style={{ width: 180 }}
            clearable
          />
          <Select
            placeholder="Filter by status"
            value={statusFilter}
            onChange={setStatusFilter}
            data={statusOptions}
            style={{ width: 180 }}
            clearable
          />
          <DatePickerInput
            type="range"
            value={dateRange}
            onChange={setDateRange}
            placeholder="Date range"
            radius="md"
            style={{ minWidth: 220 }}
            mx={2}
            clearable
            dropdownType="modal"
            size="sm"
            allowSingleDateInRange
            maxDate={new Date(2100, 11, 31)}
            minDate={new Date(2000, 0, 1)}
            label={null}
          />
        </Group>

        <Group>
          <Button variant="outline" onClick={() => setImportModalOpen(true)} leftSection={<IconUpload size={14} />}>
            Import from CSV/Excel
          </Button>

          <Button variant="outline" onClick={handleExport} leftSection={<IconDownload size={14} />}>
            Export as Excel
          </Button>

          <Button leftSection={<IconPlus size={16} />} onClick={handleNew}>
            New Invoice
          </Button>
        </Group>
      </Group>

      {loading ? (
        <Loader mt="lg" />
      ) : visibleInvoices.length > 0 ? (
        <>
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Invoice No.</Table.Th>
                <Table.Th>Invoice Date</Table.Th>
                <Table.Th>Basic Amount (₹)</Table.Th>
                <Table.Th>GST Amount (₹)</Table.Th>
                <Table.Th>Total Amount (₹)</Table.Th>
                <Table.Th>Total Deduction (₹)</Table.Th>
                <Table.Th>Net Payable (₹)</Table.Th>
                <Table.Th>Amount Paid (₹)</Table.Th>
                <Table.Th>Balance (₹)</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Action</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {visibleInvoices.map((invoice) => {
                // Calculate values (fallbacks to 0 if missing)
                const basicAmount = Number(invoice.basicAmount ?? 0);
                const gstAmount = Number(invoice.gstAmount ?? 0);
                const totalAmount = Number(invoice.totalAmount ?? 0);
                const totalDeduction = Number(invoice.totalDeduction ?? 0);
                const netPayable = Number(invoice.netPayable ?? 0);
                const amountPaid = Number(invoice.amountPaidByClient ?? 0);
                const balance = Number(invoice.balance ?? 0);
                return (
                  <Table.Tr key={invoice.id}>
                    <Table.Td>
                      <Link
                        to={`/admin-invoice/${invoice.invoiceNumber}`}
                        style={{ color: "#1c7ed6", textDecoration: "none", cursor: "pointer" }}
                      >
                        {invoice.invoiceNumber || "-"}
                      </Link>
                    </Table.Td>
                    <Table.Td>{formatDateToLong(invoice.invoiceDate)}</Table.Td>
                    <Table.Td>₹{formatMoney(basicAmount)}</Table.Td>
                    <Table.Td>₹{formatMoney(gstAmount)}</Table.Td>
                    <Table.Td>₹{formatMoney(totalAmount)}</Table.Td>
                    <Table.Td>₹{formatMoney(totalDeduction)}</Table.Td>
                    <Table.Td>₹{formatMoney(netPayable)}</Table.Td>
                    <Table.Td>₹{formatMoney(amountPaid)}</Table.Td>
                    <Table.Td>₹{formatMoney(balance)}</Table.Td>
                    <Table.Td>
                      <Badge
                        color={
                          invoice.status === "Paid"
                            ? "#20c997"
                            : invoice.status === "Under process"
                            ? "#228be6"
                            : invoice.status === "Cancelled"
                            ? "#fa5252"
                            : "#FFBF00"
                        }
                      >
                        {invoice.status || "-"}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon color="blue" variant="light" onClick={() => handleEdit(invoice)}>
                          <IconEdit size={16} />
                        </ActionIcon>
                        <ActionIcon color="red" variant="light" onClick={() => handleDelete(invoice.id)}>
                          <IconTrash size={16} />
                        </ActionIcon>
                        <ActionIcon color="green" variant="light" onClick={() => { setSelectedInvoice(invoice); setViewModalOpen(true); }}>
                          <IconEye size={16} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>

          {/* Infinite scroll trigger */}
          <div ref={loadMoreRef} style={{ height: 1 }} />
        </>
      ) : (
        <Text ta="center" mt="lg" c="dimmed">
          No invoices available.
        </Text>
      )}


  <Modal
      size="xl"
      opened={opened}
      onClose={close}
      title={selectedInvoice ? "Edit Invoice" : "Add New Invoice"}
      centered
      withCloseButton={true} // ✅ Changed to true to show the 'X' button
      closeOnClickOutside={false}
    >
      <InvoiceForm
        onSubmit={fetchInvoices}
        onClose={close}
        initialValues={selectedInvoice ?? undefined}
      />
    </Modal>

    <InvoicePopup
      opened={viewModalOpen}
      onClose={() => setViewModalOpen(false)}
      invoice={selectedInvoice}
    />

    {/* Import modal */}
    <Modal
      opened={importModalOpen}
      onClose={() => { if (!importing) setImportModalOpen(false); }}
      title="Import invoices from CSV/XLSX"
      centered
      size="lg"
    >
      <Stack>
        <Text size="sm">Upload a spreadsheet with the header row. Supported formats: .csv, .xlsx</Text>
        <FileInput
          placeholder="Pick CSV or XLSX file"
          accept=".csv,.xlsx"
          value={file}
          onChange={(f) => setFile(f)}
        />

        {importing && (
          <div>
            <Text size="sm">Importing {importProgress.current} / {importProgress.total}</Text>
            <Progress value={(importProgress.total ? (importProgress.current / importProgress.total) * 100 : 0)} mt="xs" />
          </div>
        )}

        <Group position="right">
          <Button variant="default" onClick={() => { setFile(null); setImportModalOpen(false); }} disabled={importing}>Cancel</Button>
          <Button onClick={handleImport} loading={importing} disabled={!file}>Start Import</Button>
        </Group>

        {importErrors.length > 0 && (
          <div>
            <Text weight={600}>Errors:</Text>
            {importErrors.map((e, idx) => (
              <Text key={idx} size="xs">{e}</Text>
            ))}
          </div>
        )}

      </Stack>
    </Modal>

    </Stack>
  );
}
