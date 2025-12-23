import { 
  IconCurrencyRupee, 
  IconFileInvoice, 
  IconCheck, 
  IconClock, 
  IconFilter,
  IconBell,
  IconSearch
} from '@tabler/icons-react';
// Deduction labels for summary table
const deductionLabels = [
  'GST', 'TDS', 'BOCW', 'Retention', 'GST Withheld', 'GST TDS', 'Low Depth Deduction', 'LD', 'SLA Penalty', 'Penalty', 'Other Deduction'
];
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import {
  Container,
  Grid,
  Card,
  Group,
  Stack,
  Text,
  Title,
  Select,
  Table,
  Badge,
  Loader,
  SimpleGrid,
  ScrollArea,
  Box,
  ThemeIcon,
  rem,
  Paper,
  RingProgress,
  Center,
  Avatar,
  ActionIcon,
  Divider,
  Button,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';

// Mapped to Mantine color palette names
const statusColors = {
  'Paid': 'teal',
  'Cancelled': 'orange',
  'Under process': 'blue',
  'Credit Note Issued': 'gray',
  'Rejected': 'red',
  'On Hold': 'yellow',
};

const statusHexColors = {
  'Paid': '#20c997', // teal.5
  'Cancelled': '#fd7e14', // orange.6
  'Under process': '#228be6', // blue.6
  'Credit Note Issued': '#868e96', // gray.6
  'Rejected': '#fa5252', // red.6
  'On Hold': '#fab005', // yellow.6
};

const projectOptions = ['All Projects', 'NFS', 'GAIL', 'BGCL', 'STP', 'BHARAT NET', 'NFS AMC'];
const stateOptions = ['All States', 'Kerala', 'Delhi', 'Bihar', 'MP', 'Sikkim', 'Jharkhand', 'Andaman'];
const billCategoryOptions = ['', 'Service', 'Supply', 'ROW', 'AMC', 'Restoration Service', 'Restoration Supply', 'Restoration Row', 'Spares', 'Training'];

// --- Sub-Components ---

// 1. Modern KPI Card
function StatCard({ title, value, icon, color }) {
  return (
    <Paper withBorder p="md" radius="md" shadow="xs">
      <Group justify="space-between">
        <div>
          <Text c="dimmed" tt="uppercase" fw={700} size="xs">
            {title}
          </Text>
          <Text fw={700} size="xl" mt="xs">
            ₹{Number(value).toLocaleString()}
          </Text>
        </div>
        <ThemeIcon color={color} variant="light" size="xl" radius="md">
          {icon}
        </ThemeIcon>
      </Group>
    </Paper>
  );
}

// 2. Styled SVG Bar Chart
function BarChart({ data }) {
  if (!data.length) return <Text c="dimmed" size="sm" ta="center" py="xl">No data available</Text>;
  const max = Math.max(...data.map(d => d.raised)) || 100;
  
  // Chart dimensions
  const height = 180;
  const barWidth = 14;
  const gap = 40;
  const width = Math.max(300, data.length * (barWidth * 2 + gap) + 50);

  return (
    <Box style={{ overflowX: 'auto' }}>
      <svg width={width} height={height + 30}>
        {data.map((d, i) => {
          const x = 20 + i * (barWidth * 2 + gap);
          const hRaised = (d.raised / max) * height;
          const hApproved = (d.approved / max) * height;
          
          return (
            <g key={d.name}>
              {/* Background guide line (optional) */}
              <line x1={x} y1={height} x2={x + barWidth*2 + 5} y2={height} stroke="#eee" strokeWidth="1" />
              
              {/* Raised Bar */}
              <rect 
                x={x} 
                y={height - hRaised} 
                width={barWidth} 
                height={hRaised} 
                fill="#228be6" 
                rx={4} 
              />
              
              {/* Approved Bar */}
              <rect 
                x={x + barWidth + 4} 
                y={height - hApproved} 
                width={barWidth} 
                height={hApproved} 
                fill="#fd7e14" 
                rx={4} 
              />
              
              {/* Label */}
              <text 
                x={x + barWidth} 
                y={height + 20} 
                fontSize={11} 
                textAnchor="middle" 
                fill="#868e96"
                style={{ fontFamily: 'sans-serif' }}
              >
                {d.name}
              </text>
            </g>
          );
        })}
      </svg>
      
      {/* Legend */}
      <Group justify="center" gap="md" mt="sm">
        <Group gap={6}>
          <Box w={10} h={10} bg="blue.6" style={{ borderRadius: 2 }} />
          <Text size="xs" c="dimmed">Invoice Raised</Text>
        </Group>
        <Group gap={6}>
          <Box w={10} h={10} bg="orange.6" style={{ borderRadius: 2 }} />
          <Text size="xs" c="dimmed">Invoice Approved</Text>
        </Group>
      </Group>
    </Box>
  );
}

// 3. Styled Pie Chart
import { motion } from "framer-motion";
import InvoiceLineChart from '../components/dashboardComponent/InvoiceLineChart';

function PieChart({ data }) {
  const total = data.reduce((acc, d) => acc + d.value, 0);
  if (!total) return <Text c="dimmed" size="sm" ta="center">No data</Text>;

  // Calculate percentages for display
  const dataWithPercentage = data.map(d => ({
    ...d,
    percentage: d.value > 0 ? ((d.value / total) * 100).toFixed(1) : 0
  }));

  // Animated Donut Chart using SVG (no external lib)
  let startAngle = 0;
  const radius = 60;
  const cx = 80;
  const cy = 80;

  // For animation
  const MotionGroup = motion(Group);

  return (
    <Card shadow="md" radius="md" p="md" withBorder>
      {/* Header */}
      <Group mb="md">
        <ThemeIcon variant="light" color="blue" size="lg" radius="xl">
          <IconFileInvoice size={20} />
        </ThemeIcon>
        <div>
          <Title order={5} mb={0}>Invoice Status</Title>
          <Text size="xs" c="dimmed">
            Total invoices: {total}
          </Text>
        </div>
      </Group>

      {/* Animated Donut Chart */}
      <Group justify="center" mb="md">
        <Box style={{ position: 'relative', width: 160, height: 160 }}>
          <svg width={160} height={160} style={{ transform: 'rotate(-90deg)' }}>
            {dataWithPercentage.map((d, i) => {
              if (d.value === 0) return null;
              const angle = (d.value / total) * 2 * Math.PI;
              // Handle single full circle case
              const isFull = d.value === total;

              const x1 = cx + radius * Math.cos(startAngle);
              const y1 = cy + radius * Math.sin(startAngle);
              const x2 = cx + radius * Math.cos(startAngle + angle);
              const y2 = cy + radius * Math.sin(startAngle + angle);

              const largeArc = angle > Math.PI ? 1 : 0;

              const path = isFull
                ? `M${cx},${cy - radius} A${radius},${radius} 0 1,1 ${cx},${cy + radius} A${radius},${radius} 0 1,1 ${cx},${cy - radius}`
                : `M${cx},${cy} L${x1},${y1} A${radius},${radius} 0 ${largeArc},1 ${x2},${y2} Z`;

              startAngle += angle;
              return (
                <motion.path
                  key={i}
                  d={path}
                  fill={d.color}
                  stroke="#fff"
                  strokeWidth={2}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.7, delay: i * 0.1 }}
                />
              );
            })}
            {/* Inner cutout for Donut effect */}
            <circle cx={cx} cy={cy} r={35} fill="#fff" />
          </svg>
          {/* Center Text */}
          <Box
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <Text fw={800} size="lg">{total}</Text>
            <Text size="xs" c="dimmed" lh={1} fw={600}>INVOICES</Text>
          </Box>
        </Box>
      </Group>

      <Divider my={0} />

      {/* Legend */}
      <Stack gap="xs" mt="md">
        {dataWithPercentage.map((item, i) => (
          item.value > 0 && (
            <Group key={i} gap={8} align="center" justify="space-between" wrap="nowrap">
              <Group gap={8} align="center" flex={1}>
                <Box w={12} h={12} bg={item.color} style={{ borderRadius: '50%', flexShrink: 0 }} />
                <Text size="sm" fw={500} truncate flex={1}>{item.label}</Text>
              </Group>
              <Group gap={8} align="center" justify="flex-end" wrap="nowrap">
                <Badge size="sm" variant="dot" color={item.color} fw={600}>{item.value}</Badge>
                <Text size="xs" c="dimmed" fw={600} maw={35} ta="right">{item.percentage}%</Text>
              </Group>
            </Group>
          )
        ))}
      </Stack>
    </Card>
  );
}

// --- Main Dashboard Component ---

const Dashboard2 = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState('All Projects');
  const [state, setState] = useState('All States');
  const [billCategory, setBillCategory] = useState('');
  const [dateRange, setDateRange] = useState([null, null]); // [start, end]

  // --- Logic unchanged ---
  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true);
      try {
        const token = Cookies.get('token');
        const res = await axios.get('/api/v1/invoices', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setInvoices(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      let match = true;
      if (project !== 'All Projects' && inv.project !== project) match = false;
      if (state !== 'All States' && inv.state !== state) match = false;
      if (billCategory && inv.mybillCategory !== billCategory) match = false;
      // Date range filter
      if (dateRange[0] && dateRange[1]) {
        const invDate = inv.invoiceDate ? new Date(inv.invoiceDate) : null;
        if (!invDate || isNaN(invDate)) return false;
        // Set time to 0:0:0 for start, 23:59:59 for end
        const start = new Date(dateRange[0]);
        start.setHours(0,0,0,0);
        const end = new Date(dateRange[1]);
        end.setHours(23,59,59,999);
        if (invDate < start || invDate > end) match = false;
      }
      return match;
    });
  }, [invoices, project, state, billCategory, dateRange]);

  const summary = useMemo(() => {
    let basic = 0, gst = 0, paid = 0, pending = 0, totalAmount = 0;
    filteredInvoices.forEach(inv => {
      basic += Number(inv.invoiceBasicAmount || 0);
      gst += Number(inv.invoiceGstAmount || 0);
      paid += Number(inv.amountPaidByClient || 0);
      pending += Number(inv.netPayable || 0) - Number(inv.amountPaidByClient || 0);
      totalAmount += Number(inv.totalAmount || 0);
    });
    return { basic, gst, paid, pending, totalAmount };
  }, [filteredInvoices]);

  const deductionFields = useMemo(() => {
    const totals = {};
    deductionLabels.forEach(label => { totals[label] = 0; });
    filteredInvoices.forEach(inv => {
      totals['GST'] += Number(inv.invoiceGstAmount || 0);
      totals['TDS'] += Number(inv.tds || 0);
      totals['BOCW'] += Number(inv.bocw || 0);
      totals['Retention'] += Number(inv.retention || 0);
      totals['GST Withheld'] += Number(inv.gstWithheld || 0);
      totals['GST TDS'] += Number(inv.gstTds || 0);
      totals['Low Depth Deduction'] += Number(inv.lowDepthDeduction || 0);
      totals['LD'] += Number(inv.ld || 0);
      totals['SLA Penalty'] += Number(inv.slaPenalty || 0);
      totals['Penalty'] += Number(inv.penalty || 0);
      totals['Other Deduction'] += Number(inv.otherDeduction || 0);
    });
    return deductionLabels.map(label => ({ label, value: totals[label] }));
  }, [filteredInvoices]);

  const invoiceStatus = useMemo(() => {
    const statusMap = {
      'Paid': 0, 'Cancelled': 0, 'Under process': 0, 'Credit Note Issued': 0, 'Rejected': 0, 'On Hold': 0,
    };
    filteredInvoices.forEach(inv => {
      const s = String(inv.status || '').trim();
      if (statusMap.hasOwnProperty(s)) statusMap[s]++;
    });
    return Object.entries(statusMap).map(([label, value]) => ({ label, value, color: statusHexColors[label] }));
  }, [filteredInvoices]);

  const projectRevenue = useMemo(() => {
    const map = {};
    filteredInvoices.forEach(inv => {
      const proj = inv.project || 'Unknown';
      if (!map[proj]) map[proj] = { raised: 0, approved: 0 };
      map[proj].raised += Number(inv.invoiceBasicAmount || 0);
      map[proj].approved += Number(inv.passedAmountByClient || 0);
    });
    return Object.entries(map).map(([name, vals]) => ({ name, ...vals }));
  }, [filteredInvoices]);

  const navigate = useNavigate();

  // Handler for StatCard click
  const handleStatCardClick = () => {
    if (project === 'All Projects') {
      navigate('/admin-invoice');
    } else {
      navigate(`/project/${encodeURIComponent(project)}`);
    }
  };

  // --- Render ---
  return (
    <Box style={{ minHeight: '100vh' , width:'100%'}} >
      <Container size="100%" py="md"  >
        {/* Header Section */}
        <Paper shadow="xs" p="md" radius="md" mb="xl" withBorder>
          <Group justify="space-between" align="center">
            <Group>
               <ThemeIcon size="lg" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
                 <IconFileInvoice size={20} />
               </ThemeIcon>
               <Title order={3}>Annu Projects Dashboard</Title>
            </Group>
            <Group gap="xs" visibleFrom="md">
              <Select 
                placeholder="Select Project" 
                data={projectOptions} 
                value={project} 
                onChange={setProject}
                searchable
                radius="md"
                variant="filled"
                w={180}
              />
              <Select 
                placeholder="Select State" 
                data={stateOptions} 
                value={state} 
                onChange={setState}
                searchable
                radius="md"
                variant="filled"
                w={150}
              />
              {/* Date Range Picker */}
              <DatePickerInput
                type="range"
                value={dateRange}
                onChange={setDateRange}
                placeholder="Pick date range"
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
              <Divider orientation="vertical" />
              <ActionIcon variant="light" size="lg" radius="md"><IconBell size={18} /></ActionIcon>
              <Avatar radius="xl" color="blue">AD</Avatar>
            </Group>
          </Group>
        </Paper>

        {/* Stats Grid */}
        <Group mb="xl" gap="md" align="stretch" style={{ width: '100%', flexWrap: 'nowrap' }}>
          
          <Box style={{ cursor: 'pointer', flex: 1, minWidth: 0 }} onClick={handleStatCardClick}>
            <StatCard 
              title="Basic Invoice Value" 
              value={summary.basic} 
              icon={<IconFileInvoice size="1.2rem" />} 
              color="blue" 
            />
          </Box>

          <Box style={{ cursor: 'pointer', flex: 1, minWidth: 0 }}
            onClick={() => {
              if (project === 'All Projects') {
                navigate('/select-gst');
              } else {
                navigate(`/select-gst?project=${encodeURIComponent(project)}`);
              }
            }}
          >
            <StatCard 
              title="GST Amount" 
              value={summary.gst} 
              icon={<IconCurrencyRupee size="1.2rem" />} 
              color="cyan" 
            />
          </Box>

            <Box style={{ cursor: 'pointer', flex: 1, minWidth: 0 }}>
            <StatCard 
              title="Total Invoice Amount" 
              value={summary.totalAmount} 
              icon={<IconCurrencyRupee size="1.2rem" />} 
              color="grape" 
            />
          </Box>

          <Box style={{ cursor: 'pointer', flex: 1, minWidth: 0 }}
            onClick={() => {
              if (project === 'All Projects') {
                navigate('/select-status?status=Paid');
              } else {
                navigate(`/select-status?status=Paid&project=${encodeURIComponent(project)}`);
              }
            }}
          >
            <StatCard 
              title="Total Paid" 
              value={summary.paid} 
              icon={<IconCheck size="1.2rem" />} 
              color="teal" 
            />
          </Box>
          <Box style={{ cursor: 'pointer', flex: 1, minWidth: 0 }}
            onClick={() => {
              const status = encodeURIComponent('Under Process');
              if (project === 'All Projects') {
                navigate(`/select-status?status=${status}`);
              } else {
                navigate(`/select-status?status=${status}&project=${encodeURIComponent(project)}`);
              }
            }}
          >
            <StatCard 
              title="Pending Amount" 
              value={summary.pending} 
              icon={<IconClock size="1.2rem" />} 
              color="red" 
            />
          </Box>
        </Group>

        {/* Analytics Grid */}
        <Grid gutter="md" mb="xl" align="stretch">
          
          {/* Deductions Panel */}
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Card shadow="xs" radius="md" withBorder h="100%" p="sm">
              <Group mb={8} gap={6}>
                <IconFilter size={15} color="gray" />
                <Text fw={700} size="xs" tt="uppercase" c="dimmed">Deductions</Text>
              </Group>

              <Select
                label={null}
                size="xs"
                data={billCategoryOptions.map(opt => ({ value: opt || '', label: opt || 'All' }))}
                value={billCategory === '' ? '' : billCategory}
                onChange={(v) => setBillCategory(v ?? '')}
                renderValue={(selected) => selected === '' ? 'All' : selected}
                placeholder="Bill Category"
                mb={8}
                w="100%"
              />

              <Divider my={8} label="Deductions" labelPosition="center" />

              <Box component="table" w="100%" style={{ borderCollapse: 'collapse' }}>
                <tbody>
                  {deductionFields.map((f, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f3f5' }}>
                      <td style={{ padding: '4px 0', fontSize: 12, color: '#868e96', textAlign: 'left', fontWeight: 500 }}>{f.label}</td>
                      <td style={{ padding: '4px 0', fontSize: 12, color: '#1971c2', textAlign: 'right', fontWeight: 700 }}>₹{Number(f.value).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </Box>
            </Card>
          </Grid.Col>

          {/* Revenue Chart */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card shadow="sm" radius="md" withBorder h="100%" p="lg">
              <Title order={5} mb="lg">Project Revenue Analysis</Title>
              <Box mt="auto" mb="auto">
                <BarChart data={projectRevenue} />
              </Box>
            </Card>
          </Grid.Col>

          {/* Status Pie Chart */}
          <Grid.Col span={{ base: 12, md: 3 }}>
            
                <PieChart data={invoiceStatus} />
              
          </Grid.Col>
        </Grid>

        {/* <Grid gutter="md" mb="xl" align="stretch"> */}

                  <InvoiceLineChart />

        {/* </Grid> */}

      </Container>
    </Box>
  );
};

export default React.memo(Dashboard2);