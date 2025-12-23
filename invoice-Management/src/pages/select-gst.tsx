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
  Divider,
  Center,
  Box,
  SimpleGrid,
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
  invoiceGstAmount: number;
}

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


// Horizontal Bar Chart for Top 5 GST Invoices
import { BarChart, Cell } from "recharts";

function TopGstBarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  if (!data.length) return <Text c="dimmed" size="sm" ta="center">No data</Text>;
  return (
    <Box style={{ width: "100%", height: 350 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
        >
          <XAxis type="number" tickFormatter={(v) => `₹${v.toLocaleString()}`} fontSize={12} />
          <YAxis type="category" dataKey="label" width={100} fontSize={13} />
          <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
          <Bar dataKey="value" radius={8} barSize={24}>
            {data.map((entry, idx) => (
              <Cell key={`cell-${idx}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}
export default function SelectGst() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const gstFilter = searchParams.get("gst");
  const projectFilter = searchParams.get("project");

  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [projectFilterValue, setProjectFilterValue] = useState<string | null>(projectFilter || null);
  const [statusFilterValue, setStatusFilterValue] = useState<string | null>(null);

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
    { value: "Cancelled", label: "Cancelled" },
    { value: "Under process", label: "Under process" },
    { value: "Credit Note Issued", label: "Credit Note Issued" },
  ];

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const token = Cookies.get("token");
        const res = await axios.get("/api/v1/invoices", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const allInvoices = Array.isArray(res.data) ? res.data : [];
        const filtered = allInvoices.filter((inv: InvoiceData) => {
          // Filter by GST amount (exact match or range)
          if (gstFilter) {
            if (gstFilter.includes("-")) {
              const [min, max] = gstFilter.split("-").map(Number);
              if (isNaN(min) || isNaN(max)) return false;
              if (Number(inv.invoiceGstAmount) < min || Number(inv.invoiceGstAmount) > max) return false;
            } else {
              if (Number(inv.invoiceGstAmount) !== Number(gstFilter)) return false;
            }
          }
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
        setInvoices(filtered.sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime()));
      } catch (error) {
        console.error("Error fetching GST invoices:", error);
        notifyError("Failed to load GST invoice details");
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, [gstFilter, projectFilter]);

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
        const matchesStatus = !statusFilterValue || inv.status?.toLowerCase() === statusFilterValue.toLowerCase();
        return matchesSearch && matchesProject && matchesStatus;
      })
      .slice()
      .sort((a, b) => b.invoiceGstAmount - a.invoiceGstAmount);
  }, [invoices, search, projectFilterValue, statusFilterValue]);

  // --- GST Summary ---
  const gstSummary = useMemo(() => {
    let totalGst = 0;
    let invoiceCount = 0;
    filteredInvoices.forEach(inv => {
      totalGst += Number(inv.invoiceGstAmount || 0);
      invoiceCount++;
    });
    return { totalGst, invoiceCount };
  }, [filteredInvoices]);

  // --- Chart: group by GST amount ---
  const chartData = useMemo(() => {
    const map = new Map<number, { totalGst: number; count: number }>();
    filteredInvoices.forEach((inv) => {
      const key = Number(inv.invoiceGstAmount) || 0;
      const prev = map.get(key) || { totalGst: 0, count: 0 };
      map.set(key, {
        totalGst: prev.totalGst + (inv.invoiceGstAmount || 0),
        count: prev.count + 1,
      });
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a - b)
      .map(([gst, value]) => ({
        gst,
        totalGst: value.totalGst,
        count: value.count,
      }));
  }, [filteredInvoices]);

  // --- Top 5 Invoices by GST Amount ---
  const top5Invoices = useMemo(() => {
    return filteredInvoices
      .slice()
      .sort((a, b) => b.invoiceGstAmount - a.invoiceGstAmount)
      .slice(0, 5);
  }, [filteredInvoices]);

  // --- Timeline Graph by invoiceDate (sum GST per date) ---
  const timelineData = useMemo(() => {
    const map = new Map<string, number>();
    filteredInvoices.forEach((inv) => {
      if (!inv.invoiceDate) return;
      const key = new Date(inv.invoiceDate).toISOString().slice(0, 10);
      map.set(key, (map.get(key) || 0) + (inv.invoiceGstAmount || 0));
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([dateKey, totalGst]) => ({
        dateKey,
        label: new Date(dateKey).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
        totalGst,
      }));
  }, [filteredInvoices]);

  // --- Pie Chart: Top 5 GST Invoices as slices ---
  const pieChartData = useMemo(() => {
    const colors = ["#228be6", "#fd7e14", "#20c997", "#fab005", "#fa5252"];
    return top5Invoices.map((inv, i) => ({
      label: inv.invoiceNumber,
      value: inv.invoiceGstAmount,
      color: colors[i % colors.length],
    }));
  }, [top5Invoices]);

  // --- Custom Tooltip ---
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string; }) => {
    if (!active || !payload || payload.length === 0) return null;
    const item = payload[0].payload;
    return (
      <div style={{ background: "white", borderRadius: 8, padding: "8px 10px", boxShadow: "0 4px 14px rgba(0,0,0,0.08)", border: "1px solid #eee" }}>
        <div style={{ fontSize: 12, marginBottom: 4, opacity: 0.7 }}>
          GST: ₹{item.gst}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
          Total GST: ₹{formatMoney(item.totalGst)}
        </div>
        <div style={{ fontSize: 12, opacity: 0.8 }}>Invoices: {item.count}</div>
      </div>
    );
  };

  // --- Table: sorted by GST Amount descending ---
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
              onClick={() => navigate(-1)}
            >
              Back
            </Button>
            <Title order={2}>
              {projectFilterValue ? `${projectFilterValue} - ` : ""}
              GST {gstFilter ? `₹${gstFilter}` : "All"} Invoices
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

        {/* Top Row: Total GST & Top 5 Invoices */}
        <Grid gutter="md">
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card shadow="sm" radius="md" withBorder p="xl" h="100%">
              <Text fw={700} size="xl" mb={8}>Total GST Amount</Text>
              <Text fw={700} size="xl" c="blue">₹{formatMoney(gstSummary.totalGst)}</Text>
              <Text size="sm" c="dimmed">Invoices: {gstSummary.invoiceCount}</Text>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card shadow="sm" radius="md" withBorder p="lg">
              <Text fw={700} size="lg" mb={12}>Top 5 Invoices (by GST)</Text>
              <Group gap={10} grow>
                {top5Invoices.map((inv, idx) => (
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
                        <Text fw={700} size="xs" c="blue">₹{formatMoney(inv.invoiceGstAmount)}</Text>
                      </Group>
                      
                        <Text fw={600} size="sm" truncate title={inv.invoiceNumber}>{inv.invoiceNumber}</Text>
                      
                      <Stack gap={4}>
                        {/* <Text size="xs" c="dimmed">{formatDateToLong(inv.invoiceDate)}</Text> */}
                        <Badge size="xs" color="blue" variant="light" fullWidth>{inv.status}</Badge>
                      </Stack>
                    </Stack>
                  </Paper>
                  </Link>
                ))}
              </Group>
            </Card>
          </Grid.Col>
        </Grid>

        {/* Middle Row: Timeline Graph & Pie Chart */}
        <Grid gutter="md" mt="xs">
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card shadow="sm" radius="md" withBorder p="lg" h="100%">
              <Text fw={700} size="lg" mb={8}>GST Timeline (by Invoice Date)</Text>
              <Text size="xs" c="dimmed" mb={8}>Total GST per Invoice Date</Text>
              <div style={{ width: "100%", height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineData} margin={{ top: 10, right: 16, left: 0, bottom: 8 }}>
                    <defs>
                      <linearGradient id="gstGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#228be6" stopOpacity={0.7}/>
                        <stop offset="95%" stopColor="#228be6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} tickMargin={8} stroke="#adb5bd" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#adb5bd" tickMargin={8} tickFormatter={(val)=> `₹${val/1000}k`}/>
                    <Tooltip content={({ active, payload }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      const item = payload[0].payload;
                      return (
                        <div style={{ background: "white", borderRadius: 8, padding: "8px 10px", boxShadow: "0 4px 14px rgba(0,0,0,0.08)", border: "1px solid #eee" }}>
                          <div style={{ fontSize: 12, marginBottom: 4, opacity: 0.7 }}>
                            {item.dateKey ? new Date(item.dateKey).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" }) : ''}
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                            GST: ₹{formatMoney(item.totalGst)}
                          </div>
                        </div>
                      );
                    }} />
                    <Area
                      type="monotone"
                      dataKey="totalGst"
                      stroke="#228be6"
                      fillOpacity={1}
                      fill="url(#gstGradient)"
                      dot={{ r: 3, stroke: '#228be6', strokeWidth: 2, fill: '#fff' }}
                      activeDot={{ r: 6 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card shadow="sm" radius="md" withBorder p="lg" h="100%">
              <Text fw={700} size="lg" mb={8}>Top 5 GST Invoices (Bar Chart)</Text>
              <TopGstBarChart data={pieChartData} />
            </Card>
          </Grid.Col>
        </Grid>

        {/* Table: Sorted by GST Amount Descending */}
        <Card shadow="sm" radius="md" withBorder p={0} mt="md">
          <Box p="md" bg="gray.0" style={{ borderBottom: '1px solid #dee2e6' }}>
            <Group justify="space-between">
              <Title order={5}>Invoices (sorted by GST Amount)</Title>
              {/* <Text size="xs" c="dimmed">Descending order</Text> */}
            </Group>
          </Box>
          {visibleInvoices.length > 0 ? (
            <ScrollArea h={360} type="auto" offsetScrollbars>
              <Table striped highlightOnHover withTableBorder>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Invoice</Table.Th>
                    <Table.Th>Invoice Date</Table.Th>
                    <Table.Th>GST Amount (₹)</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Project</Table.Th>
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
                      <Table.Td fw={700} c="blue">₹{formatMoney(invoice.invoiceGstAmount)}</Table.Td>
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
            </ScrollArea>
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