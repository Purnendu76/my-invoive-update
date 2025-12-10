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
} from "@mantine/core";
import { IconArrowLeft, IconSearch, IconEye } from "@tabler/icons-react";
import axios from "axios";
import Cookies from "js-cookie";
import { notifyError } from "../lib/utils/notify";

// Recharts
import {
  ResponsiveContainer,
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

// Interface matching your Admin Table
interface InvoiceData {
  id: string;
  project: string | string[];
  invoiceNumber: string;
  invoiceDate: string;
  submissionDate: string;
  totalAmount: number;
  amountPaidByClient: number; // Added
  balance: number;            // Added
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

  const statusFilter = searchParams.get("status");
  const projectFilter = searchParams.get("project");

  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(""); // Search state

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const token = Cookies.get("token");
        const res = await axios.get("/api/v1/invoices", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const allInvoices = Array.isArray(res.data) ? res.data : [];

        const filtered = allInvoices.filter((inv: InvoiceData) => {
          // Filter by status
          if (statusFilter) {
            const invStatus = inv.status ? String(inv.status).toLowerCase() : "";
            if (!invStatus.includes(statusFilter.toLowerCase())) return false;
          }

          // Filter by project
          if (projectFilter) {
            const p = inv.project;
            const target = projectFilter.toLowerCase();
            if (Array.isArray(p)) {
              if (!p.some((item) => String(item).toLowerCase() === target)) return false;
            } else {
              if (String(p).toLowerCase() !== target) return false;
            }
          }
          return true;
        });

        // Sort by date descending
        setInvoices(filtered.sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime()));
      } catch (error) {
        console.error("Error fetching details:", error);
        notifyError("Failed to load invoice details");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [statusFilter, projectFilter]);

  // ---- CHART DATA: group by submissionDate ----
  const chartData = useMemo(() => {
    const map = new Map<string, { totalAmount: number; count: number }>();

    invoices.forEach((inv) => {
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
        label: new Date(dateKey).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
        }),
        totalAmount: value.totalAmount,
        count: value.count,
      }));
  }, [invoices]);

  // ---- CUSTOM TOOLTIP ----
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

  // ---- Filter visible invoices by search ----
  const visibleInvoices = invoices.filter((inv) => 
    inv.invoiceNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    // ✅ CHANGED: size="fluid" makes it full width
    <Container size="fluid" py="xl">
      <LoadingOverlay visible={loading} />

      <Stack gap="md">
        {/* Header Section */}
        <Group justify="space-between">
          <Group>
            <Button
              variant="subtle"
              color="gray"
              leftSection={<IconArrowLeft size={18} />}
              onClick={() => navigate(-1)}
            >
              Back
            </Button>
            <Title order={2}>
              {projectFilter ? `${projectFilter} - ` : ""}
              {statusFilter} Invoices
            </Title>
            <Badge size="lg" circle>{visibleInvoices.length}</Badge>
          </Group>

          {/* Search Bar */}
          <TextInput
            placeholder="Search invoice number..."
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            style={{ width: "250px" }}
          />
        </Group>

        {/* ---- CHART ---- */}
        {chartData.length > 0 && (
          <Paper p="md"  withBorder>
            <Group justify="space-between" mb="xs">
              <div>
                <Text fw={600} size="sm">Total Amount by Submission Date</Text>
                <Text size="xs" c="dimmed">Daily revenue overview</Text>
              </div>
            </Group>
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
          </Paper>
        )}

        {/* ---- TABLE ---- */}
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
                          ? "green"
                          : invoice.status === "Under process"
                          ? "yellow"
                          : invoice.status === "Cancelled"
                          ? "red"
                          : "blue"
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
      </Stack>
    </Container>
  );
}