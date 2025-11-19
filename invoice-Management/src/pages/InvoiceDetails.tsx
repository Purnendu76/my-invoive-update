  // Format date as '12 April 2025'
  const formatDateToLong = (dateInput: Date | string | null | undefined): string => {
    if (!dateInput) return "-";
    const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return "-";
    const day = date.getDate();
    const month = date.toLocaleString("en-US", { month: "long" });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Stack,
  Title,
  Text,
  Loader,
  Badge,
  Group,
  Paper,
  Divider,
  rem,
  Grid,
  Button,
} from "@mantine/core";
import axios from "axios";
import Cookies from "js-cookie";
import { getUserRole } from "../lib/utils/getUserRole";
import type { Invoice } from "@/interface/Invoice";

export default function InvoiceDetails() {
  const { invoiceNumber } = useParams<{ invoiceNumber: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const invoiceRef = useRef<HTMLDivElement>(null);

  const fetchInvoice = async () => {
    try {
      const token = Cookies.get("token");
      const role = getUserRole();
      let url = "/api/v1/invoices";
      if (role === "user") {
        url = "/api/v1/user-invoices/project";
      }
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log(`Fetched invoices for details page [role=${role}]:`, res.data);
      const found = res.data.find((inv: Invoice) => inv.invoiceNumber === invoiceNumber);
      if (!found) {
        console.warn(`No invoice found for invoiceNumber: ${invoiceNumber}`);
      }
      setInvoice(found || null);
    } catch (error) {
      console.error("Error fetching invoice:", error);
      setInvoice(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [invoiceNumber]);

  if (loading) return <Loader size="xl" style={{ marginTop: 50 }} />;
  if (!invoice) return <Text>No invoice found</Text>;

  const num = (v: string | number | null | undefined) => {
    const n = v === null || v === undefined || v === "" ? 0 : Number(v);
    return n < 0 ? 0 : Number(n.toFixed(2));
  };
  // Robust GST percentage parser
  const parseGst = (v: string | number | null | undefined) => {
    if (v === null || v === undefined || v === "") return 0;
    if (typeof v === "number") return v;
    const cleaned = v.replace(/[^\d.]/g, "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };
  const totalDeduction =
    num(invoice.retention) +
    num(invoice.gstWithheld) +
    num(invoice.tds) +
    num(invoice.gstTds) +
    num(invoice.bocw) +
    num(invoice.lowDepthDeduction) +
    num(invoice.ld) +
    num(invoice.slaPenalty) +
    num(invoice.penalty) +
    num(invoice.otherDeduction);

  const netPayable = num(invoice.totalAmount) - totalDeduction;
  const balance = netPayable - num(invoice.amountPaidByClient);

  const fmtDate = formatDateToLong;

  const fmtProject = (p: string | string[] | null | undefined) => {
    if (!p) return "-";
    if (Array.isArray(p)) return p.join(", ");
    return String(p);
  };

  const handlePrint = () => {
    if (!invoiceRef.current) return;
    const printContent = invoiceRef.current.innerHTML;
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
  };

  return (
    <Stack gap="xl" p="xl" align="center" style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)" }}>
      <div ref={invoiceRef} style={{ width: "100%", maxWidth: 900 }}>
        <Title order={2} c="blue.8" style={{ letterSpacing: 1, fontWeight: 700, fontSize: rem(32) }}>
          Invoice <span style={{ color: '#228be6' }}>#{invoice.invoiceNumber}</span>
        </Title>

        <Paper p="xl" radius="lg" shadow="md" withBorder style={{ background: "#fff" }}>
          <Group justify="space-between" mb="md">
            <Group gap={8}>
              <Badge size="lg" color={
                invoice.status === "Paid"
                  ? "green"
                  : invoice.status === "Under process"
                  ? "yellow"
                  : invoice.status === "Cancelled"
                  ? "red"
                  : "blue"
              } variant="filled" style={{ fontSize: rem(16), padding: "0 16px" }}>
                {invoice.status}
              </Badge>
              <Badge size="md" color="gray" variant="light">
                {fmtProject(invoice.project)}
              </Badge>
            </Group>
            <Group gap={16}>
              <Text fw={700} size="xl" c="blue.7">Net Payable: ₹{netPayable}</Text>
              <Text fw={700} size="xl" c="teal.7">Balance: ₹{balance}</Text>
            </Group>
          </Group>

          <Divider my="md" label="Invoice Details" labelPosition="center" color="blue.2"/>

          <Grid gutter="xl">
            <Grid.Col span={6}>
              <Stack gap="sm">
                <Text><strong>Project:</strong> <span style={{ color: '#1971c2' }}>{fmtProject(invoice.project)}</span></Text>
                <Text><strong>Mode of Project:</strong> {invoice.modeOfProject || "-"}</Text>
                <Text><strong>State:</strong> {invoice.state || "-"}</Text>
                <Text><strong>Bill Category:</strong> {invoice.mybillCategory || "-"}</Text>
                <Text><strong>Milestone:</strong> {invoice.milestone || "-"}</Text>
                <Text><strong>Invoice Date:</strong> {fmtDate(invoice.invoiceDate)}</Text>
                <Text><strong>Submission Date:</strong> {fmtDate(invoice.submissionDate)}</Text>
                <Text><strong>Payment Date:</strong> {fmtDate(invoice.paymentDate)}</Text>
                <Text><strong>Remarks:</strong> {invoice.remarks || "-"}</Text>
              </Stack>
            </Grid.Col>

            <Grid.Col span={6}>
              <Stack gap="sm">
                <Text><strong>Invoice Basic Amount:</strong> <span style={{ color: '#1971c2' }}>₹{num(invoice.invoiceBasicAmount)}</span></Text>
                <Text><strong>GST Percentage:</strong> {invoice.gstPercentage || "-"}</Text>
                <Text><strong>Invoice GST Amount:</strong> <span style={{ color: '#1971c2' }}>₹{num(num(invoice.invoiceBasicAmount) * parseGst(invoice.gstPercentage) / 100)}</span></Text>
                <Text><strong>Total Amount:</strong> <span style={{ color: '#1971c2' }}>₹{num(invoice.totalAmount)}</span></Text>
                <Text><strong>Passed Amount by Client:</strong> ₹{num(invoice.passedAmountByClient)}</Text>
                <Text><strong>Retention:</strong> ₹{num(invoice.retention)}</Text>
                <Text><strong>GST Withheld:</strong> ₹{num(invoice.gstWithheld)}</Text>
                <Text><strong>TDS:</strong> ₹{num(invoice.tds)}</Text>
                <Text><strong>GST TDS:</strong> ₹{num(invoice.gstTds)}</Text>
                <Text><strong>BOCW:</strong> ₹{num(invoice.bocw)}</Text>
                <Text><strong>Low Depth Deduction:</strong> ₹{num(invoice.lowDepthDeduction)}</Text>
                <Text><strong>LD:</strong> ₹{num(invoice.ld)}</Text>
                <Text><strong>SLA Penalty:</strong> ₹{num(invoice.slaPenalty)}</Text>
                <Text><strong>Penalty:</strong> ₹{num(invoice.penalty)}</Text>
                <Text><strong>Other Deduction:</strong> ₹{num(invoice.otherDeduction)}</Text>
                <Divider my="xs" color="gray.2"/>
                <Text fw={700} size="lg" c="red.7"><strong>Total Deduction:</strong> ₹{num(totalDeduction)}</Text>
                <Text fw={700} size="lg" c="blue.7"><strong>Net Payable:</strong> ₹{num(netPayable)}</Text>
                <Text fw={700} size="lg" c="teal.7"><strong>Amount Paid:</strong> ₹{num(invoice.amountPaidByClient)}</Text>
                <Text fw={700} size="lg" c="teal.7"><strong>Balance:</strong> ₹{num(balance)}</Text>
              </Stack>
            </Grid.Col>
          </Grid>
        </Paper>
      </div>

      <Group mt="xl" gap="md" style={{ width: "100%", maxWidth: 900, justifyContent: "center" }}>
        <Button variant="outline" onClick={() => navigate(-1)}>← Back</Button>
        <Button variant="filled" color="blue" onClick={handlePrint}>🖨 Print</Button>
      </Group>
    </Stack>
  );
}
