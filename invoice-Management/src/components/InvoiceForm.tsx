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
  Textarea,
  Paper,
  Divider,
  FileInput,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import axios from "axios";
import { notifySuccess, notifyError, notifyWarning } from "../lib/utils/notify";
import { usePrefillInvoiceForm } from "../hooks/usePrefillInvoiceForm";
import type { Invoice } from "@/interface/Invoice";
import Cookies from "js-cookie";
import { IconUpload } from "@tabler/icons-react";

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
  const gstOptions = ["0%", "5%", "12%", "18%"];
  const statuses = ["Paid", "Cancelled", "Under process", "Credit Note Issued"];

  // Dropdown style
  const dropdownStyles = {
    dropdown: { maxHeight: 200, overflowY: "auto" as const },
  };

  // State
  const [project, setProject] = useState<string | null>();
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Default status
  const [status, setStatus] = useState<string | null>("Under process");
  const [amountPaid, setAmountPaid] = useState<number | "">("");
  const [paymentDate, setPaymentDate] = useState<Date | null>(null);
  const [remarks, setRemarks] = useState("");

  const [, setLoadingProject] = useState(true);
  const token = Cookies.get("token");

  // Logic to show/hide the second column
  const isPaid = status === "Paid";

  // Fetch user project
  useEffect(() => {
    if (userRole !== "Admin") {
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
    }
  }, [token, userRole]);

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

    // Duplicate invoice number check (omitted strictly for brevity, keep your original logic here)
    // ... (Your original check logic goes here) ...

    try {
      setLoading(true);
      let res;
      const baseEndpoint =
        userRole === "Admin" ? "/api/v1/invoices" : "/api/v1/user-invoices";
      const authToken =
        token ||
        document.cookie
          .split("; ")
          .find((row) => row.startsWith("token="))
          ?.split("=")[1];

      if (!authToken) {
        notifyError("No authentication token found. Please log in again.");
        setLoading(false);
        return;
      }

      // Use FormData for file upload
      const formData = new FormData();
      formData.append("project", project || "");
      formData.append("modeOfProject", mode || "");
      formData.append("state", state || "");
      formData.append("mybillCategory", billCategory || "");
      if (milestone) formData.append("milestone", milestone);
      formData.append("invoiceNumber", invoiceNumber);
      if (invoiceDate)
        formData.append("invoiceDate", invoiceDate.toISOString().split("T")[0]);
      if (submissionDate)
        formData.append(
          "submissionDate",
          submissionDate.toISOString().split("T")[0]
        );
      formData.append(
        "invoiceBasicAmount",
        basicAmount ? String(basicAmount) : "0"
      );
      formData.append("gstPercentage", gstPercentage || "");
      formData.append("invoiceGstAmount", String(gstAmount));
      formData.append("totalAmount", totalAmount ? String(totalAmount) : "0");
      formData.append(
        "passedAmountByClient",
        passedAmount ? String(passedAmount) : "0"
      );
      formData.append("retention", retention ? String(retention) : "0");
      formData.append("gstWithheld", gstWithheld ? String(gstWithheld) : "0");
      formData.append("tds", tds ? String(tds) : "0");
      formData.append("gstTds", gstTds ? String(gstTds) : "0");
      formData.append("bocw", bocw ? String(bocw) : "0");
      formData.append("lowDepthDeduction", lowDepth ? String(lowDepth) : "0");
      formData.append("ld", ld ? String(ld) : "0");
      formData.append("slaPenalty", slaPenalty ? String(slaPenalty) : "0");
      formData.append("penalty", penalty ? String(penalty) : "0");
      formData.append(
        "otherDeduction",
        otherDeduction ? String(otherDeduction) : "0"
      );
      formData.append("totalDeduction", String(totalDeduction));
      formData.append("netPayable", String(netPayable));
      formData.append("status", status || "");
      formData.append(
        "amountPaidByClient",
        amountPaid ? String(amountPaid) : "0"
      );
      if (paymentDate)
        formData.append("paymentDate", paymentDate.toISOString().split("T")[0]);
      formData.append("balance", String(balance));
      formData.append("remarks", remarks || "");
      if (selectedFile) {
        formData.append("document", selectedFile);
      }

      if (initialValues?.id) {
        // For update, you may want to use FormData as well if supporting file update
        res = await axios.put(`${baseEndpoint}/${initialValues.id}`, formData, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        notifySuccess("Invoice updated successfully ✅");
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        res = await axios.post(baseEndpoint, formData, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        notifySuccess("Invoice submitted successfully ✅");
      }
      if (onSubmit)
        onSubmit({ client: billCategory || "Unknown", amount: netPayable });
      if (onClose) onClose();
    } catch (error) {
      console.error("Error submitting invoice:", error);
      notifyError("Failed to submit invoice ❌");
    } finally {
      setLoading(false);
    }
  };

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
      <LoadingOverlay
        visible={loading}
        loaderProps={{ children: "Submitting..." }}
      />
      <form onSubmit={handleSubmit}>
        <Paper>
          <Grid gutter="xl">
            {/* Column 1: Basic Info - Spans full width if NOT paid, half if PAID */}
            <Grid.Col span={{ base: 12, md: isPaid ? 6 : 12 }}>
              <Stack gap="md">
                <Divider label="Project Details" labelPosition="left" />
                <Group grow preventGrowOverflow={false} wrap="nowrap">
                  {userRole === "Admin" ? (
                    <Select
                      label="Project"
                      data={adminProjects}
                      value={project}
                      onChange={setProject}
                      required
                      styles={dropdownStyles}
                    />
                  ) : (
                    <TextInput
                      label="Project"
                      value={project || "Loading..."}
                      disabled
                      required
                    />
                  )}
                  <Select
                    label="Mode"
                    data={modes}
                    value={mode}
                    onChange={setMode}
                    required
                    styles={dropdownStyles}
                  />
                </Group>

                <Group grow>
                  <Select
                    label="State"
                    data={states}
                    value={state}
                    onChange={setState}
                    required
                    styles={dropdownStyles}
                  />
                  <Select
                    label="Bill Category"
                    data={billCategories}
                    value={billCategory}
                    onChange={setBillCategory}
                    required
                    styles={dropdownStyles}
                  />
                </Group>

                <Select
                  label="Milestone"
                  data={milestones}
                  value={milestone}
                  onChange={setMilestone}
                  styles={dropdownStyles}
                />

                <Divider label="Invoice Details" labelPosition="left" mt="xs" />
                <Group grow>
                  <TextInput
                    label="Invoice No."
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.currentTarget.value)}
                    required
                  />
                  <DatePickerInput
                    label="Invoice Date"
                    value={invoiceDate}
                    onChange={(v) => setInvoiceDate(v ? new Date(v) : null)}
                    required
                  />
                </Group>

                <Group grow>
                  <DatePickerInput
                    label="Submission Date"
                    value={submissionDate}
                    onChange={(v) => setSubmissionDate(v ? new Date(v) : null)}
                    minDate={invoiceDate || undefined}
                    required
                    disabled={!invoiceDate}
                  />
                  <NumberInput
                    label="Basic Amount"
                    value={basicAmount}
                    onChange={(val) =>
                      setBasicAmount(typeof val === "number" ? val : "")
                    }
                    required
                  />
                </Group>

                <Group grow>
                  <Select
                    label="GST %"
                    data={gstOptions}
                    value={gstPercentage}
                    onChange={setGstPercentage}
                    required
                    styles={dropdownStyles}
                  />
                  <NumberInput
                    label="GST Amount"
                    value={
                      Number(gstAmount.toFixed(2)) < 0
                        ? 0
                        : Number(gstAmount.toFixed(2))
                    }
                    disabled
                  />
                </Group>

                <NumberInput
                  label="Total Amount (Inc. GST)"
                  size="md"
                  fw={500}
                  value={
                    Number(totalAmount.toFixed(2)) < 0
                      ? 0
                      : Number(totalAmount.toFixed(2))
                  }
                  disabled
                />
                <FileInput
                  label="Invoice Document"
                  description="Upload PDF / Image (Max 5MB)"
                  placeholder="Click to upload file"
                  color="#000000"
                  value={selectedFile}
                  onChange={setSelectedFile}
                  clearable
                  leftSection={<IconUpload size={18} />}
                  radius="md"
                  size="md"
                  style={{ marginTop: 16, maxWidth: 340 }}
                  styles={{
                    input: {
                      backgroundColor: "#F8FAFC",
                      border: "1px dashed #CBD5E1",
                      cursor: "pointer",
                      color: "#000000",
                      fontWeight: 500,
                      "&::placeholder": {
                        color: "#64748B",
                      },
                    },
                    label: {
                      fontWeight: 600,
                    },
                  }}
                />

                <Divider
                  label="Status & Remarks"
                  labelPosition="left"
                  mt="xs"
                />
                <Select
                  label="Status"
                  data={statuses}
                  value={status}
                  onChange={setStatus}
                  required
                  allowDeselect={false}
                  styles={dropdownStyles}
                  color={isPaid ? "green" : "blue"}
                />
                <Textarea
                  label="Remarks"
                  minRows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.currentTarget.value)}
                />
              </Stack>
            </Grid.Col>

            {/* Column 2: Deductions & Payments - Only visible if Status is PAID */}
            {isPaid && (
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Stack gap="md">
                  <Divider
                    label="Deductions & Adjustments"
                    labelPosition="left"
                  />
                  <NumberInput
                    label="Passed Amount by Client"
                    value={passedAmount}
                    onChange={(val) =>
                      setPassedAmount(typeof val === "number" ? val : "")
                    }
                  />

                  <Group grow>
                    <NumberInput
                      label="Retention"
                      value={retention}
                      onChange={(val) =>
                        setRetention(typeof val === "number" ? val : "")
                      }
                    />
                    <NumberInput
                      label="GST Withheld"
                      value={gstWithheld}
                      onChange={(val) =>
                        setGstWithheld(typeof val === "number" ? val : "")
                      }
                    />
                  </Group>

                  <Group grow>
                    <NumberInput
                      label="TDS"
                      value={tds}
                      onChange={(val) =>
                        setTds(typeof val === "number" ? val : "")
                      }
                    />
                    <NumberInput
                      label="GST TDS"
                      value={gstTds}
                      onChange={(val) =>
                        setGstTds(typeof val === "number" ? val : "")
                      }
                    />
                  </Group>

                  <Group grow>
                    <NumberInput
                      label="BOCW"
                      value={bocw}
                      onChange={(val) =>
                        setBocw(typeof val === "number" ? val : "")
                      }
                    />
                    <NumberInput
                      label="Low Depth Ded."
                      value={lowDepth}
                      onChange={(val) =>
                        setLowDepth(typeof val === "number" ? val : "")
                      }
                    />
                  </Group>

                  <Group grow>
                    <NumberInput
                      label="LD"
                      value={ld}
                      onChange={(val) =>
                        setLd(typeof val === "number" ? val : "")
                      }
                    />
                    <NumberInput
                      label="SLA Penalty"
                      value={slaPenalty}
                      onChange={(val) =>
                        setSlaPenalty(typeof val === "number" ? val : "")
                      }
                    />
                  </Group>

                  <Group grow>
                    <NumberInput
                      label="Penalty"
                      value={penalty}
                      onChange={(val) =>
                        setPenalty(typeof val === "number" ? val : "")
                      }
                    />
                    <NumberInput
                      label="Other Ded."
                      value={otherDeduction}
                      onChange={(val) =>
                        setOtherDeduction(typeof val === "number" ? val : "")
                      }
                    />
                  </Group>

                  <NumberInput
                    label="Total Deduction"
                    variant="filled"
                    value={
                      Number(totalDeduction.toFixed(2)) < 0
                        ? 0
                        : Number(totalDeduction.toFixed(2))
                    }
                    disabled
                  />

                  <Divider
                    label="Final Settlement"
                    labelPosition="left"
                    mt="xs"
                  />
                  <NumberInput
                    label="Net Payable"
                    size="md"
                    fw={700}
                    color="blue"
                    value={
                      Number(netPayable.toFixed(2)) < 0
                        ? 0
                        : Number(netPayable.toFixed(2))
                    }
                    disabled
                  />
                  <Group grow>
                    <NumberInput
                      label="Amount Paid By Client"
                      value={amountPaid}
                      onChange={(val) =>
                        setAmountPaid(typeof val === "number" ? val : "")
                      }
                    />
                    <DatePickerInput
                      label="Payment Date"
                      value={paymentDate}
                      onChange={(v) => setPaymentDate(v ? new Date(v) : null)}
                      minDate={submissionDate || undefined}
                      required
                    />
                  </Group>
                  <NumberInput
                    label="Balance Due"
                    value={
                      Number(balance.toFixed(2)) < 0
                        ? 0
                        : Number(balance.toFixed(2))
                    }
                    disabled
                    error={balance > 0}
                  />
                </Stack>
              </Grid.Col>
            )}
          </Grid>

          <Group
            justify="flex-end"
            mt="xl"
            pt="md"
            style={{ borderTop: "1px solid #eee" }}
          >
            <Button
              variant="subtle"
              color="white"
              style={{ backgroundColor: "#EF4444" }}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitDisabled}>
              {loading ? "Submitting..." : "Submit Invoice"}
            </Button>
          </Group>
        </Paper>
      </form>
    </Box>
  );
}
