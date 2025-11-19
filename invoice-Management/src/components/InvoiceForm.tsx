import { useState, useEffect } from "react";
import { getUserRole } from "../lib/utils/getUserRole";
import {
  Select,
  TextInput,
  NumberInput,
  Button,
  Group,
  Stack,
  Grid,
  Box,
  LoadingOverlay,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import axios from "axios";
import { notifySuccess, notifyError, notifyWarning } from "../lib/utils/notify";
import { usePrefillInvoiceForm } from "../hooks/usePrefillInvoiceForm";
import type { Invoice } from "@/interface/Invoice";
import Cookies from "js-cookie";

type InvoiceFormProps = {
  onSubmit?: (data: { client: string; amount: number }) => void;
  onClose?: () => void;
  initialValues?: Invoice;
};

export default function InvoiceForm({
  onSubmit,
  onClose,
  initialValues,
}: InvoiceFormProps) {
  const [loading, setLoading] = useState(false);

  // Dropdown options
  const modes = ["Back To Back", "Direct"];
  const states = [
    "West Bengal",
    "Delhi",
    "Bihar",
    "MP",
    "Kerala",
    "Sikkim",
    "Jharkhand",
    "Andaman",
  ];
  const billCategories = [
    "Service",
    "Supply",
    "ROW",
    "AMC",
    "Restoration Service",
    "Restoration Supply",
    "Restoration Row",
    "Spares",
    "Training",
  ];
  const milestones = ["60%", "90%", "100%"];
  const gstOptions = ["0%", "5%", "12%", "18%", "20%"];
  const statuses = ["Paid", "Cancelled", "Under process", "Credit Note Issued"];

  // Dropdown style
  const dropdownStyles = {
    dropdown: { maxHeight: 120, overflowY: "auto" as const },
  };

  // State
  const [project, setProject] = useState<string | null>(null);
  const userRole = getUserRole();
  const adminProjects = ["NFS", "GAIL", "BGCL", "STP", "BHARAT NET", "NFS AMC"];

  const [mode, setMode] = useState<string | null>(null);
  const [state, setState] = useState<string | null>(null);
  const [billCategory, setBillCategory] = useState<string | null>(null);
  const [milestone, setMilestone] = useState<string | null>(null);

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState<Date | null>(null);
  const [submissionDate, setSubmissionDate] = useState<Date | null>(null);

  const [basicAmount, setBasicAmount] = useState<number | "">("");
  const [gstPercentage, setGstPercentage] = useState<string | null>(null);

  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [passedAmount, setPassedAmount] = useState<number | "">("");
  const [retention, setRetention] = useState<number | "">("");
  const [gstWithheld, setGstWithheld] = useState<number | "">("");
  const [tds, setTds] = useState<number | "">("");
  const [gstTds, setGstTds] = useState<number | "">("");
  const [bocw, setBocw] = useState<number | "">("");
  const [lowDepth, setLowDepth] = useState<number | "">("");
  const [ld, setLd] = useState<number | "">("");
  const [slaPenalty, setSlaPenalty] = useState<number | "">("");
  const [penalty, setPenalty] = useState<number | "">("");
  const [otherDeduction, setOtherDeduction] = useState<number | "">("");

  const [status, setStatus] = useState<string | null>("pending");
  const [amountPaid, setAmountPaid] = useState<number | "">("");
  const [paymentDate, setPaymentDate] = useState<Date | null>(null);
  const [remarks, setRemarks] = useState("");

  const [, setLoadingProject] = useState(true);
  const token = Cookies.get("token");

  // Fetch user project
  useEffect(() => {
    const fetchUserProject = async () => {
      if (!token) {
        setLoadingProject(false);
        return;
      }

      try {
        const res = await axios.get("/api/v1/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProject(res.data.projectRole || null);
      } catch (error) {
        console.error("Failed to fetch user project:", error);
        setProject(null);
      } finally {
        setLoadingProject(false);
      }
    };
    fetchUserProject();
  }, [token]);

  // Prefill for editing
  usePrefillInvoiceForm({
    initialValues,
    setters: {
      setInvoiceNumber,
      setInvoiceDate,
      setSubmissionDate,
      setBasicAmount,
      setGstPercentage,
      setTotalAmount,
      setPassedAmount,
      setRetention,
      setGstWithheld,
      setTds,
      setGstTds,
      setBocw,
      setLowDepth,
      setLd,
      setSlaPenalty,
      setPenalty,
      setOtherDeduction,
      setStatus,
      setAmountPaid,
      setPaymentDate,
      setRemarks,
      setProject,
      setMode,
      setState,
      setBillCategory,
      setMilestone,
    },
  });

  // Derived values
  const gstAmount =
    basicAmount && gstPercentage
      ? (Number(basicAmount) * Number(gstPercentage.replace("%", ""))) / 100
      : 0;
  const totalDeduction =
    Number(retention || 0) +
    Number(tds || 0) +
    Number(gstTds || 0) +
    Number(bocw || 0) +
    Number(lowDepth || 0) +
    Number(ld || 0) +
    Number(slaPenalty || 0) +
    Number(penalty || 0) +
    Number(otherDeduction || 0);
  const netPayable = Number(totalAmount || 0) - totalDeduction;
  const balance = netPayable - Number(amountPaid || 0);

  useEffect(() => {
    setTotalAmount(Number(basicAmount || 0) + gstAmount);
  }, [basicAmount, gstAmount]);

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const requiredFields = [
      project,
      mode,
      state,
      billCategory,
      invoiceNumber,
      invoiceDate,
      submissionDate,
      basicAmount,
      gstPercentage,
      status,
    ];

    const missing = requiredFields.some(
      (f) => f === null || f === "" || f === undefined
    );
    if (missing) {
      notifyWarning("Please fill all required fields ❌");
      return;
    }

    if (paymentDate && submissionDate && paymentDate < submissionDate) {
      notifyError("Payment date must be later than Submission Date ❌");
      return;
    }

    // Duplicate invoice number check (for new and edit flows)
    try {
      const tokenLocal = token || document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      if (!tokenLocal) {
        notifyError("No authentication token found. Please log in again.");
        return;
      }

      // Admin should check against the global invoices endpoint so they can add for any project
      const endpoint = userRole === "Admin" ? "/api/v1/invoices" : "/api/v1/user-invoices/project";

      const existingRes = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${tokenLocal}` },
      });

      const invoicesList = Array.isArray(existingRes.data) ? existingRes.data : [];

      const invoiceExists = invoicesList.some((inv: Record<string, unknown>) => {
        const invNum = inv.invoiceNumber ? String(inv.invoiceNumber).trim().toLowerCase() : "";
        if (!invNum) return false;
        const sameNumber = invNum === String(invoiceNumber).trim().toLowerCase();

        // If Admin, also ensure the invoice belongs to the selected project
        if (userRole === "Admin") {
          // inv.project can be string or array
          const invProject = inv.project;
          const selectedProject = project ? String(project).trim().toLowerCase() : "";
          const matchesProject = Array.isArray(invProject)
            ? (invProject as unknown[]).some((p) => String(p).trim().toLowerCase() === selectedProject)
            : (invProject ? String(invProject).trim().toLowerCase() === selectedProject : false);

          if (!matchesProject) return false;

          // If editing, ignore same id
          if (initialValues?.id) {
            const invId = inv.id ? String(inv.id) : "";
            return sameNumber && invId !== String(initialValues.id);
          }
          return sameNumber;
        }

        // Non-admin flow: ignore current invoice id when editing
        if (initialValues?.id) {
          const invId = inv.id ? String(inv.id) : "";
          return sameNumber && invId !== String(initialValues.id);
        }
        return sameNumber;
      });

      if (invoiceExists) {
        if (userRole === "Admin") {
          // Use the specific warning text requested
          notifyWarning("user numver alredy exist");
        } else {
          notifyWarning("Invoice number already exists ❌");
        }
        return;
      }
    } catch (err) {
      console.error("Error checking existing invoices:", err);
      notifyError("Failed to verify invoice number uniqueness. Please try again.");
      return;
    }

    const payload = {
      project,
      modeOfProject: mode,
      state,
      mybillCategory: billCategory,
      milestone,
      invoiceNumber,
      invoiceDate: invoiceDate?.toISOString().split("T")[0] || null,
      submissionDate: submissionDate?.toISOString().split("T")[0] || null,
      invoiceBasicAmount: basicAmount || 0,
      gstPercentage,
      invoiceGstAmount: gstAmount,
      totalAmount: totalAmount || 0,
      passedAmountByClient: passedAmount || 0,
      retention: retention || 0,
      gstWithheld: gstWithheld || 0,
      tds: tds || 0,
      gstTds: gstTds || 0,
      bocw: bocw || 0,
      lowDepthDeduction: lowDepth || 0,
      ld: ld || 0,
      slaPenalty: slaPenalty || 0,
      penalty: penalty || 0,
      otherDeduction: otherDeduction || 0,
      totalDeduction,
      netPayable,
      status,
      amountPaidByClient: amountPaid || 0,
      paymentDate: paymentDate?.toISOString().split("T")[0] || null,
      balance,
      remarks,
    };

    try {
      setLoading(true);
      let res;

      // Use admin endpoints for Admin, user endpoints for normal users
      const baseEndpoint = userRole === "Admin" ? "/api/v1/invoices" : "/api/v1/user-invoices";

      // Ensure we have a token; fallback to cookie parsing if necessary
      const authToken = token || document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      if (!authToken) {
        notifyError("No authentication token found. Please log in again.");
        setLoading(false);
        return;
      }

      if (initialValues?.id) {
        res = await axios.put(`${baseEndpoint}/${initialValues.id}`, payload, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        notifySuccess("Invoice updated successfully ✅");
      } else {
        res = await axios.post(baseEndpoint, payload, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        notifySuccess("Invoice submitted successfully ✅");
      }
      if (onSubmit)
        onSubmit({ client: billCategory || "Unknown", amount: netPayable });
      if (onClose) onClose();
      console.log(res.data);
    } catch (error) {
      console.error("Error submitting invoice:", error);
      notifyError("Failed to submit invoice ❌");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Disable submit until all required filled
  const isSubmitDisabled =
    loading ||
    !project ||
    project === "Loading..." ||
    !mode ||
    !state ||
    !billCategory ||
    !invoiceNumber ||
    !invoiceDate ||
    !submissionDate ||
    !basicAmount ||
    !gstPercentage ||
    !status;

  return (
    <Box pos="relative">
      <LoadingOverlay visible={loading} loaderProps={{ children: "Submitting..." }} />
      <form onSubmit={handleSubmit}>
        <Stack>
          <Grid gutter="md">
            {/* Column 1 */}
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Stack gap="sm">
                {userRole === "Admin" ? (
                  <Select
                    size="sm"
                    label="Project"
                    data={adminProjects}
                    value={project}
                    onChange={setProject}
                    required
                    styles={dropdownStyles}
                  />
                ) : (
                  <TextInput
                    size="sm"
                    label="Project"
                    value={project || "Loading..."}
                    disabled
                    required
                  />
                )}

                <Select size="sm" label="Mode of Project" data={modes} value={mode} onChange={setMode} required styles={dropdownStyles} />
                <Select size="sm" label="State" data={states} value={state} onChange={setState} required styles={dropdownStyles} />
                <Select size="sm" label="Bill Category" data={billCategories} value={billCategory} onChange={setBillCategory} required styles={dropdownStyles} />
                <Select size="sm" label="Milestone" data={milestones} value={milestone} onChange={setMilestone} styles={dropdownStyles} />
                <TextInput size="sm" label="Invoice Number" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.currentTarget.value)} required />
                <DatePickerInput size="sm" label="Invoice Date" value={invoiceDate} onChange={(v) => setInvoiceDate(v ? new Date(v) : null)} required />
                <DatePickerInput size="sm" label="Submission Date" value={submissionDate} onChange={(v) => setSubmissionDate(v ? new Date(v) : null)} minDate={invoiceDate || undefined} required disabled={!invoiceDate} />
                <NumberInput size="sm" label="Invoice Basic Amount" value={basicAmount} onChange={(val) => setBasicAmount(typeof val === "number" ? val : "")} required />
                <Select size="sm" label="GST Percentage Applicable" data={gstOptions} value={gstPercentage} onChange={setGstPercentage} required styles={dropdownStyles} />
                <NumberInput size="sm" label="Invoice GST Amount" value={Number(gstAmount.toFixed(2)) < 0 ? 0 : Number(gstAmount.toFixed(2))} disabled />
                <NumberInput size="sm" label="Total Amount" value={Number(totalAmount.toFixed(2)) < 0 ? 0 : Number(totalAmount.toFixed(2))} disabled />
                <NumberInput size="sm" label="Passed Amount by Client" value={passedAmount} onChange={(val) => setPassedAmount(typeof val === "number" ? val : "")} />
              </Stack>
            </Grid.Col>

            {/* Column 2 */}
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Stack gap="sm">
                <NumberInput size="sm" label="Retention" value={retention} onChange={(val) => setRetention(typeof val === "number" ? val : "")} />
                <NumberInput size="sm" label="GST Withheld" value={gstWithheld} onChange={(val) => setGstWithheld(typeof val === "number" ? val : "")} />
                <NumberInput size="sm" label="TDS" value={tds} onChange={(val) => setTds(typeof val === "number" ? val : "")} />
                <NumberInput size="sm" label="GST TDS" value={gstTds} onChange={(val) => setGstTds(typeof val === "number" ? val : "")} />
                <NumberInput size="sm" label="BOCW" value={bocw} onChange={(val) => setBocw(typeof val === "number" ? val : "")} />
                <NumberInput size="sm" label="Low Depth Deduction" value={lowDepth} onChange={(val) => setLowDepth(typeof val === "number" ? val : "")} />
                <NumberInput size="sm" label="LD" value={ld} onChange={(val) => setLd(typeof val === "number" ? val : "")} />
                <NumberInput size="sm" label="SLA Penalty" value={slaPenalty} onChange={(val) => setSlaPenalty(typeof val === "number" ? val : "")} />
                <NumberInput size="sm" label="Penalty" value={penalty} onChange={(val) => setPenalty(typeof val === "number" ? val : "")} />
                <NumberInput size="sm" label="Other Deduction" value={otherDeduction} onChange={(val) => setOtherDeduction(typeof val === "number" ? val : "")} />
                <NumberInput size="sm" label="Total Deduction" value={Number(totalDeduction.toFixed(2)) < 0 ? 0 : Number(totalDeduction.toFixed(2))} disabled />
                <NumberInput size="sm" label="Net Payable" value={Number(netPayable.toFixed(2)) < 0 ? 0 : Number(netPayable.toFixed(2))} disabled />
                <Select size="sm" label="Status" data={statuses} value={status} onChange={setStatus} required styles={dropdownStyles} />
                <NumberInput size="sm" label="Amount Paid By Client" value={amountPaid} onChange={(val) => setAmountPaid(typeof val === "number" ? val : "")} />
                <DatePickerInput size="sm" label="Payment Date" value={paymentDate} onChange={(v) => setPaymentDate(v ? new Date(v) : null)} disabled={status !== "Paid"} minDate={submissionDate || undefined} required />
                <NumberInput size="sm" label="Balance" value={Number(balance.toFixed(2)) < 0 ? 0 : Number(balance.toFixed(2))} disabled />
                <TextInput size="sm" label="Remarks" value={remarks} onChange={(e) => setRemarks(e.currentTarget.value)} />
              </Stack>
            </Grid.Col>
          </Grid>

          <Group justify="flex-end" mt="md" gap="sm">
            <Button size="sm" variant="outline" color="red" onClick={onClose}>
              Close
            </Button>
            <Button size="sm" type="submit" disabled={isSubmitDisabled}>
              {loading ? "Submitting..." : "Submit"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Box>
  );
}
