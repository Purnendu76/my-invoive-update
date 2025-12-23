import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import {
  Container,
  Title,
  Table,
  Badge,
  Button,
  Group,
  Paper,
  Text,
  LoadingOverlay,
  Stack,
  TextInput,
  ActionIcon,
  Grid,
  Card,
  Box,
  ScrollArea,
  Select,
} from "@mantine/core";
import { IconArrowLeft, IconSearch, IconEye } from "@tabler/icons-react";
import axios from "axios";
import Cookies from "js-cookie";
import { notifyError } from "../lib/utils/notify";

import {
  ResponsiveContainer,
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";

interface InvoiceData {
  id: string;
  project: string | string[];
  invoiceNumber: string;
  invoiceDate: string;
  submissionDate: string;
  totalAmount: number;
  amountPaidByClient: number;
  balance: number;
  mybillCategory: string;
  status: string;
}

// Helpers
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

export default function SelectedStatus() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const statusParam = searchParams.get("status");
  const projectParam = searchParams.get("project");

  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [projectFilterValue, setProjectFilterValue] = useState<string | null>(projectParam || null);
  const [statusFilterValue, setStatusFilterValue] = useState<string | null>(statusParam || null);

  // Build unique project options from invoices
  const projectOptions = useMemo(() => {
    return Array.from(
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
  }, [invoices]);

  const statusOptions = [
    { value: "Paid", label: "Paid" },
    { value: "Under process", label: "Under Process" },
    { value: "Credit Note Issued", label: "Credit Note Issued" },
    { value: "Cancelled", label: "Cancelled" },
  ];

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const token = Cookies.get("token");
        const res = await axios.get("/api/v1/invoices", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const allInvoices = Array.isArray(res.data) ? res.data : [];
        setInvoices(
          allInvoices.sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime())
        );
      } catch (error) {
        console.error("Error fetching details:", error);
        notifyError("Failed to load invoice details");
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  // --- Filtered Invoices (applies all filters) ---
  const filteredInvoices = useMemo(() => {
    return invoices
      .filter((inv) => {
        const matchesSearch = inv.invoiceNumber.toLowerCase().includes(search.toLowerCase());
        const matchesProject = projectFilterValue
          ? (Array.isArray(inv.project)
              ? inv.project.some((p) => p.toLowerCase() === projectFilterValue.toLowerCase())
              : inv.project?.toLowerCase() === projectFilterValue.toLowerCase())
          : true;
        const matchesStatus = statusFilterValue
          ? inv.status?.toLowerCase() === statusFilterValue.toLowerCase()
          : true;
        return matchesSearch && matchesProject && matchesStatus;
      })
      .slice()
      .sort((a, b) => b.invoiceDate && a.invoiceDate ? new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime() : 0);
  }, [invoices, search, projectFilterValue, statusFilterValue]);

  // --- Summary Card Data ---
  const summary = useMemo(() => {
    let totalAmount = 0;
    let totalPaid = 0;
    let totalBalance = 0;
    filteredInvoices.forEach(inv => {
      totalAmount += Number(inv.totalAmount || 0);
      totalPaid += Number(inv.amountPaidByClient || 0);
      totalBalance += Number(inv.balance || 0);
    });
    return { totalAmount, totalPaid, totalBalance, count: filteredInvoices.length };
  }, [filteredInvoices]);

  // --- Top 5 Invoices (by Paid or Net Payable) ---
  const top5Invoices = useMemo(() => {
    if (statusFilterValue && statusFilterValue.toLowerCase() === "paid") {
      return filteredInvoices
        .slice()
        .sort((a, b) => (b.amountPaidByClient || 0) - (a.amountPaidByClient || 0))
        .slice(0, 5);
    } else {
      return filteredInvoices
        .slice()
        .sort((a, b) => (b.balance || 0) - (a.balance || 0))
        .slice(0, 5);
    }
  }, [filteredInvoices, statusFilterValue]);

  // --- Chart Data: group by submissionDate ---
  const chartData = useMemo(() => {
    const map = new Map<string, { totalAmount: number; count: number }>();
    filteredInvoices.forEach((inv) => {
      if (!inv.submissionDate) return;
      const key = new Date(inv.submissionDate).toISOString().slice(0, 10);
      const prev = map.get(key) || { totalAmount: 0, count: 0 };
      map.set(key, {
        totalAmount: prev.totalAmount + (inv.totalAmount || 0),
        count: prev.count + 1,
      });
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([dateKey, value]) => ({
        dateKey,
        label: new Date(dateKey).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
        totalAmount: value.totalAmount,
        count: value.count,
      }));
  }, [filteredInvoices]);

  // --- Custom Tooltip ---
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string; }) => {
    if (!active || !payload || payload.length === 0) return null;
    const item = payload[0].payload;
    return (
      <div style={{ background: "white", borderRadius: 8, padding: "8px 10px", boxShadow: "0 4px 14px rgba(0,0,0,0.08)", border: "1px solid #eee" }}>
        <div style={{ fontSize: 12, marginBottom: 4, opacity: 0.7 }}>
          {item?.dateKey ? new Date(item.dateKey).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" }) : label}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
          Total: ₹{formatMoney(item.totalAmount)}
        </div>
        <div style={{ fontSize: 12, opacity: 0.8 }}>Invoices: {item.count}</div>
      </div>
    );
  };

  // --- Table: sorted by date descending ---
  const visibleInvoices = filteredInvoices;

  return (
    <Container size="2xl" py="xl">
      <LoadingOverlay visible={loading} />
      <Stack gap="md">
        {/* Header Section */}
        <Group justify="space-between" mb="md">
          <Group>
            <Button
              variant="subtle"
              color="gray"
              leftSection={<IconArrowLeft size={18} />}
              onClick={() => navigate('/dashboard-2')}
            >
              Back to Dashboard
            </Button>
            <Title order={2}>
              {projectFilterValue ? `${projectFilterValue} - ` : ""}
              {statusFilterValue ? `${statusFilterValue} ` : "All"} Invoices
            </Title>
            <Badge size="lg" circle>{visibleInvoices.length}</Badge>
          </Group>
          <Group gap="sm">
            <TextInput
              placeholder="Search invoice number..."
              leftSection={<IconSearch size={16} />}
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              style={{ width: "200px" }}
            />
            <Select
              placeholder="Filter by project"
              value={projectFilterValue}
              onChange={setProjectFilterValue}
              data={projectOptions}
              style={{ width: 160 }}
              clearable
            />
            <Select
              placeholder="Filter by status"
              value={statusFilterValue}
              onChange={setStatusFilterValue}
              data={statusOptions}
              style={{ width: 160 }}
              clearable
            />
          </Group>
        </Group>

        {/* Top Row: Summary Cards + Top 5 Invoices Card */}
        <Grid gutter="md">
          {/* First half: 3 summary cards */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Grid gutter="md" >
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Card shadow="sm" radius="md" withBorder p="xl" h="100%">
                  <Text fw={700} size="xl" mb={8}>Total Amount</Text>
                  <Text fw={700} size="xl" c="blue">₹{formatMoney(summary.totalAmount)}</Text>
                  <Text size="sm" c="dimmed">Invoices: {summary.count}</Text>
                  <br />
                </Card>
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Card shadow="sm" radius="md" withBorder p="xl" h="100%">
                  <Text fw={700} size="xl" mb={8}>Total Paid</Text>
                  <Text fw={700} size="xl" c="green">₹{formatMoney(summary.totalPaid)}</Text>
                  <Text size="sm" c="dimmed">Invoices: {summary.count}</Text>
                </Card>
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Card shadow="sm" radius="md" withBorder p="xl" h="100%">
                  <Text fw={700} size="xl" mb={8}>Total Balance</Text>
                  <Text fw={700} size="xl" c="red">₹{formatMoney(summary.totalBalance)}</Text>
                  <Text size="sm" c="dimmed">Invoices: {summary.count}</Text>
                </Card>
              </Grid.Col>
            </Grid>
          </Grid.Col>
          {/* Second half: Top 5 Invoices card */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card shadow="sm" radius="md" withBorder p="lg" h="100%">
              <Text fw={700} size="lg" mb={12}>
                Top 5 Invoices ({statusFilterValue && statusFilterValue.toLowerCase() === "paid" ? "by Amount Paid" : "by Net Payable"})
              </Text>
              <Group gap={10} grow>
                {top5Invoices.length > 0 ? top5Invoices.map((inv, idx) => (
                  <Link
                    to={`/admin-invoice/${inv.invoiceNumber}`}
                    style={{ color: "#1c7ed6", textDecoration: "none", cursor: "pointer" }}
                    key={inv.id}
                  >
                    <Paper p="md" radius="md" withBorder bg="gray.0" style={{ minWidth: 0 }}>
                      <Stack gap={6}>
                        <Group justify="space-between" align="flex-start">
                          <Box w={24} h={24} radius="md" bg="blue.1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Text fw={700} size="xs" c="blue">{idx + 1}</Text>
                          </Box>
                          <Text fw={700} size="xs" c="blue">
                            ₹{formatMoney(statusFilterValue && statusFilterValue.toLowerCase() === "paid" ? inv.amountPaidByClient : inv.balance)}
                          </Text>
                        </Group>
                        <Text fw={600} size="sm" truncate title={inv.invoiceNumber}>{inv.invoiceNumber}</Text>
                        <Stack gap={4}>
                          <Badge size="xs" color="blue" variant="light" fullWidth>{inv.status}</Badge>
                        </Stack>
                      </Stack>
                    </Paper>
                  </Link>
                )) : (
                  <Text c="dimmed" size="sm" ta="center">No data</Text>
                )}
              </Group>
            </Card>
          </Grid.Col>
        </Grid>

        {/* Middle Row: Chart
        {chartData.length > 0 && (
          <Card shadow="sm" radius="md" withBorder p="lg" h="100%">
            <Text fw={700} size="lg" mb={8}>Total Amount by Submission Date</Text>
            <Text size="xs" c="dimmed" mb={8}>Daily revenue overview</Text>
            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ReBarChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} tickMargin={8} stroke="#adb5bd" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#adb5bd" tickMargin={8} tickFormatter={(val)=> `₹${val/1000}k`}/>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="totalAmount" name="Total amount" radius={[4, 4, 0, 0]} barSize={36} fill="#228be6" />
                </ReBarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )} */}

        {/* Table: Sorted by Date Descending */}
        <Card shadow="sm"  withBorder p={0} mt="md">
          <Box p="md" bg="gray.0" style={{ borderBottom: '1px solid #dee2e6' }}>
            <Group justify="space-between">
              <Title order={5}>Invoices (sorted by Date)</Title>
            </Group>
          </Box>
          {visibleInvoices.length > 0 ? (
            <Table striped highlightOnHover withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Invoice</Table.Th>
                  <Table.Th>Invoice Date</Table.Th>
                  <Table.Th>Total Amount (₹)</Table.Th>
                  <Table.Th>Amount Paid (₹)</Table.Th>
                  <Table.Th>Balance (₹)</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Projects</Table.Th>
                  <Table.Th>Action</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {visibleInvoices.map((invoice) => (
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
                    <Table.Td>₹{formatMoney(invoice.totalAmount)}</Table.Td>
                    <Table.Td>₹{formatMoney(invoice.amountPaidByClient)}</Table.Td>
                    <Table.Td>₹{formatMoney(invoice.balance)}</Table.Td>
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
                      {Array.isArray(invoice.project) ? (
                        <Group gap="xs">
                          {invoice.project.map((proj) => (
                            <Badge key={String(proj)} color="blue" variant="light">
                              {proj}
                            </Badge>
                          ))}
                        </Group>
                      ) : (
                        <Text size="sm">{invoice.project || "-"}</Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <ActionIcon 
                          color="gray" 
                          variant="light" 
                          component={Link}
                          to={`/admin-invoice/${invoice.invoiceNumber}`}
                      >
                        <IconEye size={16} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          ) : (
            <Text align="center" py="xl" c="dimmed">
              No invoices found.
            </Text>
          )}
        </Card>
      </Stack>
    </Container>
  );
}