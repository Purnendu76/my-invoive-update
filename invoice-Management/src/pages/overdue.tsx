import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import {
  Title,
  Table,
  Badge,
  Button,
  Group,
  Text,
  LoadingOverlay,
  Stack,
  TextInput,
  ActionIcon,
  Select,
  ScrollArea,
} from "@mantine/core";
import { IconArrowLeft, IconSearch } from "@tabler/icons-react";
import axios from "axios";
import Cookies from "js-cookie";
import { notifyError } from "../lib/utils/notify";

function formatDateToLong(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return "-";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "-";
  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "long" });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

const formatMoney = (val: number | null | undefined): string => {
  const n = Number(val ?? 0);
  if (isNaN(n) || n <= 0) return "0.00";
  return n.toFixed(2);
};


// Aging periods for overdue invoices (same as OverdueBarChart)
const agingPeriods = [
  { label: '1 week', value: '1w', ms: 7 * 24 * 60 * 60 * 1000 },
  { label: '15 days', value: '15d', ms: 15 * 24 * 60 * 60 * 1000 },
  { label: '1 month', value: '1m', ms: 30 * 24 * 60 * 60 * 1000 },
  { label: '3 months', value: '3m', ms: 90 * 24 * 60 * 60 * 1000 },
  { label: '6 months', value: '6m', ms: 180 * 24 * 60 * 60 * 1000 },
];

const timeframeMap: Record<string, number> = agingPeriods.reduce((acc, cur) => {
  acc[cur.value] = cur.ms;
  return acc;
}, {
  "2w": 14 * 24 * 60 * 60 * 1000,
  "2m": 60 * 24 * 60 * 60 * 1000,
  "1y": 365 * 24 * 60 * 60 * 1000,
  "6months": 180 * 24 * 60 * 60 * 1000,
  "2weeks": 14 * 24 * 60 * 60 * 1000,
});

export default function Overdue() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Query param defaults
  const projectParam = searchParams.get("project") || "";
  const dateParam = searchParams.get("date") || "invoiceDate";
  const timeframeParam = searchParams.get("timeframe") || "6m";

  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState<string>(projectParam);
  const [dateFilter, setDateFilter] = useState<string>(dateParam);
  const [timeframeFilter, setTimeframeFilter] = useState<string>(timeframeParam);

  // Project options (add 'All Projects' at the top)
  const projectOptions = useMemo(() => {
    const projects = Array.from(
      new Set(
        invoices.flatMap((inv) =>
          Array.isArray(inv.project)
            ? inv.project
            : inv.project
            ? [inv.project]
            : []
        )
      )
    ).map((p) => ({ value: p as string, label: p as string }));
    return [
      { value: 'all', label: 'All Projects' },
      ...projects
    ];
  }, [invoices]);

  // Date options
  const dateOptions = [
    { value: "invoiceDate", label: "Invoice Date" },
    { value: "submissionDate", label: "Submission Date" },
  ];

  // Timeframe options (sync with agingPeriods)
  const timeframeOptions = [
    ...agingPeriods.map(p => ({ label: p.label, value: p.value })),
    // { label: '2 weeks', value: '2w' },
    // { label: '2 months', value: '2m' },
    // { label: '1 year', value: '1y' },
  ];

  // Fetch all invoices
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const token = Cookies.get("token");
        const res = await axios.get("/api/v1/invoices", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setInvoices(Array.isArray(res.data) ? res.data : []);
      } catch {
        notifyError("Failed to load invoice details");
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);


  // OverdueBarChart-like logic: show all invoices for the selected project, grouped by aging period and date type
  // This will allow the user to see the breakdown for each period and date type
  const overdueAgingData = useMemo(() => {
    // Only 'Under process' status
    const filtered = invoices.filter(inv => inv.status === 'Under process');
    // Project filter
    const projectFiltered = projectFilter && projectFilter !== 'all'
      ? filtered.filter(inv => Array.isArray(inv.project) ? inv.project.includes(projectFilter) : inv.project === projectFilter)
      : filtered;
    // For each aging period, count for both invoiceDate and submissionDate
    const now = Date.now();
    const agingCounts: Record<string, { invoiceDate: number; submissionDate: number }> = {};
    agingPeriods.forEach(period => {
      agingCounts[period.value] = { invoiceDate: 0, submissionDate: 0 };
    });
    projectFiltered.forEach(inv => {
      // Invoice Date
      const invDate = inv.invoiceDate ? new Date(inv.invoiceDate).getTime() : null;
      if (invDate && !isNaN(invDate)) {
        const ageInMs = now - invDate;
        agingPeriods.forEach(period => {
          if (ageInMs >= period.ms) agingCounts[period.value].invoiceDate++;
        });
      }
      // Submission Date
      const subDate = inv.submissionDate ? new Date(inv.submissionDate).getTime() : null;
      if (subDate && !isNaN(subDate)) {
        const ageInMs = now - subDate;
        agingPeriods.forEach(period => {
          if (ageInMs >= period.ms) agingCounts[period.value].submissionDate++;
        });
      }
    });
    return agingPeriods.map(period => ({
      label: period.label,
      value: period.value,
      invoiceDate: agingCounts[period.value].invoiceDate,
      submissionDate: agingCounts[period.value].submissionDate,
    }));
  }, [invoices, projectFilter]);

  // Strictly filter invoices based on project, date, and timeframe (as per user requirements)
  const filteredInvoices = useMemo(() => {
    if (!projectFilter || !dateFilter || !timeframeFilter) return [];
    const now = Date.now();
    const ms = timeframeMap[timeframeFilter] || timeframeMap["6m"];
    const cutoff = now - ms;
    return invoices.filter((inv) => {
      // Only 'Under process' status
      if (inv.status !== 'Under process') return false;
      // Project filter
      if (projectFilter !== 'all') {
        if (Array.isArray(inv.project)) {
          if (!inv.project.includes(projectFilter)) return false;
        } else {
          if (inv.project !== projectFilter) return false;
        }
      }
      // Date filter
      const dateValue = inv[dateFilter as 'invoiceDate' | 'submissionDate'];
      if (!dateValue) return false;
      const dateMs = new Date(dateValue).getTime();
      if (isNaN(dateMs)) return false;
      // Timeframe: only include if date is less than or equal to cutoff (i.e., older than cutoff)
      if (dateMs > cutoff) return false;
      // Search filter
      if (search && !String(inv.invoiceNumber || '').toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [invoices, projectFilter, dateFilter, timeframeFilter, search]);

  return (
    <Stack>
      <LoadingOverlay visible={loading} />
      {/* Header Section */}
      <Group justify="space-between" align="flex-start" mb="md">
        <Stack gap="xs">
          <Group gap="xs">
            <Title order={2}>Overdue Invoices</Title>
            {projectFilter && (
              <Badge color="blue" size="lg" variant="filled">{projectFilter}</Badge>
            )}
          </Group>
          <Text c="dimmed" size="sm">
            View and track all overdue invoices with status "Under process" for the selected project, date, and timeframe.
          </Text>
        </Stack>
        <Button
          variant="subtle"
          color="gray"
          leftSection={<IconArrowLeft size={18} />}
          onClick={() => navigate('/dashboard-2')}
        >
          Back to Dashboard
        </Button>
      </Group>

      {/* Filters Section */}
      <Group gap="sm">
        <TextInput
          placeholder="Search invoice number..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          style={{ width: "200px" }}
        />
        <Select
          placeholder="Project"
          value={projectFilter}
          onChange={v => setProjectFilter(v || "all")}
          data={projectOptions}
          style={{ width: 180 }}
          clearable={false}
          searchable
        />
        <Select
          placeholder="Consideration Date"
          value={dateFilter}
          onChange={v => setDateFilter(v || "invoiceDate")}
          data={dateOptions}
          style={{ width: 180 }}
          clearable={false}
        />
        <Select
          placeholder="Timeframe"
          value={timeframeFilter}
          onChange={v => setTimeframeFilter(v || "6m")}
          data={timeframeOptions}
          style={{ width: 140 }}
          clearable={false}
        />
      </Group>
      {filteredInvoices.length > 0 ? (
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Invoice No.</Table.Th>
              <Table.Th>Invoice Date</Table.Th>
              <Table.Th>Submission Date</Table.Th>
              <Table.Th>Basic Amount (₹)</Table.Th>
              <Table.Th>GST Amount (₹)</Table.Th>
              <Table.Th>Total Amount (₹)</Table.Th>
              <Table.Th>Total Deduction (₹)</Table.Th>
              <Table.Th>Net Payable (₹)</Table.Th>
              <Table.Th>Amount Paid (₹)</Table.Th>
              <Table.Th>Balance (₹)</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredInvoices.map((invoice) => {
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
                  <Table.Td>{formatDateToLong(invoice.submissionDate)}</Table.Td>
                  <Table.Td>₹{formatMoney(basicAmount)}</Table.Td>
                  <Table.Td>₹{formatMoney(gstAmount)}</Table.Td>
                  <Table.Td>₹{formatMoney(totalAmount)}</Table.Td>
                  <Table.Td>₹{formatMoney(totalDeduction)}</Table.Td>
                  <Table.Td>₹{formatMoney(netPayable)}</Table.Td>
                  <Table.Td>₹{formatMoney(amountPaid)}</Table.Td>
                  <Table.Td>₹{formatMoney(balance)}</Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      ) : (
        <Text ta="center" mt="lg" c="dimmed">
          No overdue invoices found.
        </Text>
      )}
    </Stack>
  );
}