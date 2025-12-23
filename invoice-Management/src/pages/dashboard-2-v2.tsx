
import React, { useState, useEffect, useMemo } from 'react';
// Overdue Bar Chart Component and types (move above Dashboard2)
import { Tooltip } from '@mantine/core';
import { Link } from 'react-router-dom';
import { IconChartBar } from '@tabler/icons-react';
type OverdueBarChartData = { name: string; invoiceDate: number; submissionDate: number };
type OverdueBarChartProps = { data: OverdueBarChartData[] };
function OverdueBarChart({ data, timeframe = '6months' }: OverdueBarChartProps & { timeframe?: string }) {
  if (!data || !data.length) return (<Text c="dimmed" size="sm" ta="center" py="xl">No data available</Text>);
  // Dynamic Y-axis scale: round up to nearest 1, 2, 5, 10, 20, 50, 100, etc.
  const maxRaw = Math.max(...data.map((d: OverdueBarChartData) => Math.max(d.invoiceDate, d.submissionDate))) || 1;
  function getNiceMax(val) {
    if (val <= 5) return 5;
    const pow = Math.pow(10, Math.floor(Math.log10(val)));
    const n = Math.ceil(val / pow);
    if (n <= 2) return 2 * pow;
    if (n <= 5) return 5 * pow;
    return 10 * pow;
  }
  const max = getNiceMax(maxRaw);
  const height = 220;
  const barWidth = 16;
  const gap = 50;
  const width = Math.max(350, data.length * (barWidth * 2 + gap) + 70);
  const yTicks = 5;
  const yStep = max / yTicks;
  const yAxisWidth = 45;
  
  return (
    <>
      {/* Header */}
      {/* <Group mb="lg" gap="sm">
        
        <div>
          <Title order={5} mb={0}>Overdue Analysis</Title>
          <Text size="xs" c="dimmed">Invoice vs Submission Timeline</Text>
        </div>
      </Group> */}

      {/* Chart Container */}
      <Box style={{ overflowX: 'auto', borderRadius: '8px'}}>
        <svg width={width} height={height + 50} style={{ minWidth: '100%' }}>
          {/* Y-axis */}
          <line x1={yAxisWidth} y1={0} x2={yAxisWidth} y2={height} stroke="#d0d8df" strokeWidth={2} />
          
          {/* Y-axis lines and labels */}
          {[...Array(yTicks + 1)].map((_, i) => {
            const y = height - (i * (height / yTicks));
            return (
              <g key={i}>
                <line x1={yAxisWidth - 4} y1={y} x2={yAxisWidth} y2={y} stroke="#d0d8df" strokeWidth={1.5} />
                <line x1={yAxisWidth} y1={y} x2={width - 10} y2={y} stroke="#f1f3f5" strokeWidth={1} strokeDasharray="3,3" />
                <text
                  x={yAxisWidth - 8}
                  y={y + 4}
                  fontSize={12}
                  textAnchor="end"
                  fill="#575e68"
                  fontWeight="500"
                  style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                >
                  {Math.round(i * yStep)}
                </text>
              </g>
            );
          })}
          
          {/* Bars and tooltips */}
          {data.map((d: OverdueBarChartData, i: number) => {
            const x = yAxisWidth + 20 + i * (barWidth * 2 + gap);
            const hInv = (d.invoiceDate / max) * height;
            const hSub = (d.submissionDate / max) * height;
            const projectParam = encodeURIComponent(d.name);
            const tfParam = encodeURIComponent(timeframe);
            return (
              <g key={d.name}>
                {/* Invoice Date Bar with Tooltip and Link */}
                <Tooltip label={`Pending since Invoice Date: ${d.invoiceDate}`} position="top" withArrow>
                  <Link
                    to={`/overdue?project=${projectParam}&date=invoiceDate&timeframe=${tfParam}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <motion.rect
                      x={x}
                      y={height - hInv}
                      width={barWidth}
                      height={Math.max(hInv, 2)}
                      fill="#228be6"
                      rx={4}
                      style={{ cursor: 'pointer', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
                      opacity={0.9}
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ duration: 0.6, delay: i * 0.08 }}
                      transform={`translate(0,${height - hInv})`}
                      transformOrigin={`0 ${hInv}`}
                    />
                  </Link>
                </Tooltip>
                {/* Submission Date Bar with Tooltip and Link */}
                <Tooltip label={`Pending since Submission Date: ${d.submissionDate}`} position="top" withArrow>
                  <Link
                    to={`/overdue?project=${projectParam}&date=submissionDate&timeframe=${tfParam}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <motion.rect
                      x={x + barWidth + 6}
                      y={height - hSub}
                      width={barWidth}
                      height={Math.max(hSub, 2)}
                      fill="#a3cff5"
                      rx={4}
                      style={{ cursor: 'pointer', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
                      opacity={0.9}
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ duration: 0.6, delay: i * 0.08 + 0.04 }}
                      transform={`translate(0,${height - hSub})`}
                      transformOrigin={`0 ${hSub}`}
                    />
                  </Link>
                </Tooltip>
                {/* Label */}
                <text
                  x={x + barWidth + 3}
                  y={height + 25}
                  fontSize={12}
                  textAnchor="middle"
                  fill="#495057"
                  fontWeight="500"
                  style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                >
                  {d.name}
                </text>
              </g>
            );
          })}
        </svg>
      </Box>

      {/* Legend */}
      <Group gap="lg" justify="center">
        <Group gap={8} align="center">
          <Box w={14} h={14} bg="#228be6" style={{ borderRadius: 3 }} />
          <Text size="sm" fw={500}>Invoice Date</Text>
        </Group>
        <Group gap={8} align="center">
          <Box w={14} h={14} bg="#a3cff5" style={{ borderRadius: 3 }} />
          <Text size="sm" fw={500}>Submission Date</Text>
        </Group>
      </Group>
    </>
  );
}

// ...existing code...

// Remove all hook calls from here. They will be inside Dashboard2.
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
  // 'GST',
   'TDS', 'BOCW', 'Retention', 'GST Withheld', 'GST TDS', 'Low Depth Deduction', 'LD', 'SLA Penalty', 'Penalty', 'Other Deduction'
];
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
// Status values as per schema.js
const statusList = [
  'Paid',
  'Under process',
  'Credit Note Issued',
  'Cancelled',
];
const statusColors = {
  'Paid': 'teal',
  'Cancelled': 'orange',
  'Under process': 'blue',
  'Credit Note Issued': 'gray',
};
const statusHexColors = {
  'Paid': '#20c997', // teal.5
  'Cancelled': '#fa5252', // orange.6
  'Under process': '#228be6', // blue.6
  'Credit Note Issued': '#FFBF00', // gray.6
};

const projectOptions = ['All Projects', 'NFS', 'GAIL', 'BGCL', 'STP', 'BHARAT NET', 'NFS AMC'];
const stateOptions = ['All States', 'West Bengal', 'Delhi', 'Bihar', 'MP', 'Kerala', 'Sikkim', 'Jharkhand', 'Andaman'];
const billCategoryOptions = ['', 'Service', 'Supply', 'ROW', 'AMC', 'Restoration Service', 'Restoration Supply', 'Restoration Row', 'Spares', 'Training'];

// Generate financial year options dynamically
function getFinancialYearOptions(currentYear = 2025, count = 5) {
  const options = [
    { value: 'all', label: 'Select Financial Year', range: null },
  ];
  for (let i = 0; i < count; i++) {
    const startYear = currentYear - i;
    const endYear = startYear + 1;
    // Format: FY 2025-26
    const label = `FY ${startYear}-${String(endYear).slice(-2)}`;
    // Range: [startDate, endDate]
    const range = [
      new Date(`${startYear}-04-01T00:00:00.000Z`),
      new Date(`${endYear}-03-31T23:59:59.999Z`)
    ];
    options.push({ value: `${startYear}-${endYear}`, label, range });
  }
  return options;
}
const financialYearOptions = getFinancialYearOptions(2025, 5);

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
                fill="#a3cff5" 
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
          <Box w={10} h={10} bg="#a3cff5" style={{ borderRadius: 2 }} />
          <Text size="xs" c="dimmed">Invoice Approved</Text>
        </Group>
      </Group>
    </Box>
  );
}

// 3. Styled Pie Chart
import { DonutChart } from '@mantine/charts';
import { motion } from 'framer-motion';

function PieChart({ data, projectFilter }) {
  // Prepare data for DonutChart
  const chartData = (data || []).map((d) => ({
    name: d.label,
    value: d.value,
    color: d.color,
  }));

  // Center label: total invoices
  const total = chartData.reduce((acc, d) => acc + d.value, 0);
  const chartLabel = `${total} Invoices`;

  // Add percentage to each chartData item
  const chartDataWithPercent = chartData.map((item) => ({
    ...item,
    percent: total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0',
  }));

  // Use projectFilter prop for the project query param
  const pieProps = {
    onClick: (segment) => {
      if (!segment || !segment.name) return;
      let statusParam = '';
      if (segment.name.toLowerCase() === 'under process') statusParam = 'Under%20Process';
      else statusParam = encodeURIComponent(segment.name);
      let url = `/select-status?status=${statusParam}`;
      if (projectFilter && projectFilter !== 'All Projects') {
        url += `&project=${encodeURIComponent(projectFilter)}`;
      }
      window.location.href = url;
    },
    style: { cursor: 'pointer' },
  };

  return (
    <Card shadow="md" radius="md" p="md" withBorder>
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
      <Group justify="center" mb="md">
        <DonutChart
          data={chartData}
          size={160}
          thickness={30}
          withLabels
          labelsType="value"
          paddingAngle={2}
          tooltipDataSource="segment"
          chartLabel={chartLabel}
          strokeWidth={1}
          pieProps={pieProps}
        />
      </Group>
      {/* Legends */}
      <Stack gap="xs" mt="md">
        {chartDataWithPercent.map((item, i) => (
          <Group key={i} gap={8} align="center" justify="space-between" wrap="nowrap">
            <Group gap={8} align="center" flex={1}>
              <Box w={12} h={12} bg={item.color} style={{ borderRadius: '50%', flexShrink: 0 }} />
              <Text size="sm" fw={500} truncate flex={1} tt="capitalize">{item.name}</Text>
            </Group>
            <Group gap={8} align="center" justify="flex-end" wrap="nowrap">
              <Text size="sm" fw={600}>{item.value}</Text>
              <Text size="xs" c="dimmed" fw={600} maw={35} ta="right">{item.percent}%</Text>
            </Group>
          </Group>
        ))}
      </Stack>
    </Card>
  );
}

// --- Main Dashboard Component ---


// Overdue timeframe options
const overdueModes = [
  { label: '1 week', value: '1w', ms: 7 * 24 * 60 * 60 * 1000 },
  { label: '2 weeks', value: '2w', ms: 14 * 24 * 60 * 60 * 1000 },
  { label: '1 month', value: '1m', ms: 30 * 24 * 60 * 60 * 1000 },
  { label: '2 months', value: '2m', ms: 60 * 24 * 60 * 60 * 1000 },
  { label: '3 months', value: '3m', ms: 90 * 24 * 60 * 60 * 1000 },
  { label: '6 months', value: '6m', ms: 180 * 24 * 60 * 60 * 1000 },
  { label: '1 year', value: '1y', ms: 365 * 24 * 60 * 60 * 1000 },
];


const Dashboard2 = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState('All Projects');
  const [state, setState] = useState('All States');
  const [billCategory, setBillCategory] = useState('');

  const [dateRange, setDateRange] = useState([null, null]); // [start, end]
  const [financialYear, setFinancialYear] = useState('all');
  // Status filter: default is all selected
  const statusOptionsList = [{ value: 'all', label: 'Status' }, ...statusList.map(s => ({ value: s, label: s }))];
  const [statusFilter, setStatusFilter] = useState<string[]>(['all']);

  // Overdue mode state (default 6 months)
  const [overdueMode, setOverdueMode] = useState<string>('6m');


  // --- Logic unchanged ---
  // ...existing code...

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

  const filteredInvoices = useMemo<any[]>(() => {
    return invoices.filter((inv: any) => {
      let match = true;
      if (project !== 'All Projects' && inv.project !== project) match = false;
      if (state !== 'All States' && inv.state !== state) match = false;
      if (billCategory && inv.mybillCategory !== billCategory) match = false;
      // Status filter
      if (!(statusFilter.includes('all') || statusFilter.length === 0)) {
        const invStatus = String(inv.status || '').trim();
        // Use strict match with statusList for robustness
        if (!statusFilter.some(s => s === invStatus)) match = false;
      }
      // Financial year filter
      if (financialYear !== 'all') {
        const fy = financialYearOptions.find(opt => opt.value === financialYear);
        if (fy && fy.range) {
          const range = fy.range as Date[];
          const invDate = inv.invoiceDate ? new Date(inv.invoiceDate).getTime() : null;
          if (!invDate || isNaN(invDate)) return false;
          if (invDate < range[0].getTime() || invDate > range[1].getTime()) match = false;
        }
      }
      // Date range filter (overrides financial year if set)
      if (dateRange[0] && dateRange[1]) {
        const invDate = inv.invoiceDate ? new Date(inv.invoiceDate).getTime() : null;
        if (!invDate || isNaN(invDate)) return false;
        // Set time to 0:0:0 for start, 23:59:59 for end
        const start = new Date(dateRange[0]);
        start.setHours(0,0,0,0);
        const end = new Date(dateRange[1]);
        end.setHours(23,59,59,999);
        if (invDate < start.getTime() || invDate > end.getTime()) match = false;
      }
      return match;
    });
  }, [invoices, project, state, billCategory, dateRange, financialYear, statusFilter]);

  // Overdue by project calculation (must be after filteredInvoices)
  const overdueByProject = useMemo<OverdueBarChartData[] | null>(() => {
    if (!(statusFilter.length === 1 && statusFilter[0] === 'Under process')) return null;
    const modeObj = overdueModes.find(m => m.value === overdueMode) || overdueModes[5]; // default 6m
    const now = Date.now();
    const from = now - modeObj.ms;
    // Only consider filteredInvoices with status 'Under process'
    const filtered = filteredInvoices.filter((inv: any) => String(inv.status || '').trim() === 'Under process');
    // Group by project
    const projectMap: Record<string, { invoiceDate: number; submissionDate: number }> = {};
    projectOptions.filter(p => p !== 'All Projects').forEach(proj => {
      projectMap[proj] = { invoiceDate: 0, submissionDate: 0 };
    });
    filtered.forEach((inv: any) => {
      const proj = projectOptions.includes(inv.project) ? inv.project : null;
      if (!proj || proj === 'All Projects') return;
      // invoiceDate: count if in [from, now]
      const invDate = inv.invoiceDate ? new Date(inv.invoiceDate).getTime() : null;
      if (invDate && invDate >= from && invDate <= now) projectMap[proj].invoiceDate++;
      // submissionDate: count if in [from, now]
      const subDate = inv.submissionDate ? new Date(inv.submissionDate).getTime() : null;
      if (subDate && subDate >= from && subDate <= now) projectMap[proj].submissionDate++;
    });
    // Convert to array for chart
    return projectOptions.filter(p => p !== 'All Projects').map(proj => ({
      name: proj,
      invoiceDate: projectMap[proj].invoiceDate,
      submissionDate: projectMap[proj].submissionDate,
    }));
  }, [filteredInvoices, statusFilter, overdueMode]);

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
    const totals: Record<string, number> = {};
    deductionLabels.forEach(label => { totals[label] = 0; });
    filteredInvoices.forEach((inv: any) => {
      // totals['GST'] += Number(inv.invoiceGstAmount || 0);
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
    const statusMap = {};
    statusList.forEach(s => { statusMap[s] = 0; });
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
               <Title order={3}>Financial Dashboard</Title>
            </Group>
            <Paper
              shadow="0"
              radius="md"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <Select
                placeholder="Project"
                value={project === 'All Projects' ? '' : project}
                onChange={val => setProject(val || 'All Projects')}
                data={projectOptions.map(p => ({ value: p === 'All Projects' ? '' : p, label: p }))}
                w={170}
                size="sm"
                radius="md"
                clearable={project !== 'All Projects'}
                withinPortal
                searchable
              />
              <Select
                placeholder="State"
                value={state === 'All States' ? '' : state}
                onChange={val => setState(val || 'All States')}
                data={stateOptions.map(s => ({ value: s === 'All States' ? '' : s, label: s }))}
                w={140}
                size="sm"
                radius="md"
                clearable={state !== 'All States'}
                withinPortal
                searchable
              />
              <Select
                placeholder="Financial Year"
                value={financialYear === 'all' ? '' : financialYear}
                onChange={val => setFinancialYear(val || 'all')}
                data={financialYearOptions.map(opt => ({ value: opt.value === 'all' ? '' : opt.value, label: opt.label }))}
                w={180}
                size="sm"
                radius="md"
                clearable={financialYear !== 'all'}
                withinPortal
              />
              <Select
                placeholder="Status"
                value={statusFilter[0] === 'all' ? '' : statusFilter[0]}
                onChange={val => {
                  if (!val || val === 'all' || val === '') setStatusFilter(['all']);
                  else setStatusFilter([val]);
                }}
                data={statusOptionsList.map(opt => ({
                  value: opt.value === 'all' ? '' : opt.value,
                  label: String(opt.label)
                    .split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ')
                }))}
                w={150}
                size="sm"
                radius="md"
                clearable={statusFilter[0] !== 'all'}
                withinPortal
              />
              <DatePickerInput
                type="range"
                value={dateRange}
                onChange={setDateRange}
                placeholder="Select date range"
                w={180}
                size="sm"
                radius="md"
                clearable
                dropdownType="modal"
                allowSingleDateInRange
                maxDate={new Date(2100, 11, 31)}
                minDate={new Date(2000, 0, 1)}
                label={null}
                withinPortal
              />
              <Divider orientation="vertical" mx={4} />
              <ActionIcon variant="light" size="lg" radius="md"><IconBell size={18} /></ActionIcon>
              <Avatar radius="xl" color="blue">AD</Avatar>
            </Paper>
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
            onClick={handleStatCardClick}
          >
            <StatCard 
              title="GST Amount" 
              value={summary.gst} 
              icon={<IconCurrencyRupee size="1.2rem" />} 
              color="cyan" 
            />
          </Box>

            <Box style={{ cursor: 'pointer', flex: 1, minWidth: 0 }} onClick={handleStatCardClick}>
            <StatCard 
              title="Total Invoice Amount" 
              value={summary.totalAmount} 
              icon={<IconCurrencyRupee size="1.2rem" />} 
              color="grape" 
            />
          </Box>

          <Box style={{ cursor: 'pointer', flex: 1, minWidth: 0 }}
            onClick={handleStatCardClick}
          >
            <StatCard 
              title="Total Paid" 
              value={summary.paid} 
              icon={<IconCheck size="1.2rem" />} 
              color="teal" 
            />
          </Box>
          <Box style={{ cursor: 'pointer', flex: 1, minWidth: 0 }}
           onClick={handleStatCardClick}
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
                <Text fw={700} size="xs" tt="uppercase" c="dimmed">Bill Category</Text>
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

          {/* Revenue/Overdue Chart Panel */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            {statusFilter.length === 1 && statusFilter[0] === 'Under process' && overdueByProject ? (
              <Card shadow="sm" radius="md" withBorder h="100%" p="lg">
                <Group justify="space-between" align="center" mb="md">
                  <Title order={5} mb={0}>
                    <ThemeIcon variant="light" color="blue" size="lg" radius="md" mr={10}>
                      <IconChartBar size={20} />
                    </ThemeIcon>
                    Overdue By {overdueModes.find(m => m.value === overdueMode)?.label || ''}
                  </Title>
                  <Select
                    size="xs"
                    w={140}
                    value={overdueMode}
                    onChange={setOverdueMode}
                    data={overdueModes.map(m => ({ value: m.value, label: m.label }))}
                    withinPortal
                  />
                </Group>
                <Box mt="auto" mb="auto">
                  <OverdueBarChart data={overdueByProject} timeframe={overdueMode} />
                </Box>
                {/* Legends */}
                <Group justify="center" gap="md" mt="sm">
                  
                </Group>
              </Card>
            ) : (
              <Card shadow="sm" radius="md" withBorder h="100%" p="lg">
                <Title order={5} mb="lg">Project Revenue Analysis</Title>
                <Box mt="auto" mb="auto">
                  <BarChart data={projectRevenue} />
                </Box>
              </Card>
            )}
          </Grid.Col>

          {/* Status Pie Chart */}
          <Grid.Col span={{ base: 12, md: 3 }}>
            <PieChart data={invoiceStatus} projectFilter={project} />
          </Grid.Col>
        </Grid>

        {/* Latest Invoices Table (filtered) */}
        <Card shadow="xs" radius="md" withBorder mt="md" p="lg">
          <Group justify="space-between" align="center" mb="md">
            <Title order={5} mb={0}>Latest Invoices</Title>
            <Button
              component={Link}
              to="/admin-invoice"
              variant="outline"
              size="xs"
              color="blue"
              radius="md"
            >
              Full Details
            </Button>
          </Group>
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
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(filteredInvoices || []).slice(0, 10).map((invoice) => {
                const basicAmount = Number(invoice.basicAmount ?? invoice.invoiceBasicAmount ?? 0);
                const gstAmount = Number(invoice.gstAmount ?? invoice.invoiceGstAmount ?? 0);
                const totalAmount = Number(invoice.totalAmount ?? 0);
                const totalDeduction = Number(invoice.totalDeduction ?? 0);
                const netPayable = Number(invoice.netPayable ?? 0);
                const amountPaid = Number(invoice.amountPaidByClient ?? 0);
                const balance = Number(invoice.balance ?? 0);
                return (
                  <Table.Tr key={invoice.id}>
                    <Table.Td>
                      {invoice.invoiceNumber ? (
                        <Link to={`/admin-invoice/${invoice.invoiceNumber || encodeURIComponent(invoice.invoiceNumber)}`}
                          style={{ color: '#228be6', textDecoration: 'none' }}
                        >
                          {invoice.invoiceNumber}
                        </Link>
                      ) : "-"}
                    </Table.Td>
                    <Table.Td>{invoice.invoiceDate ? (typeof invoice.invoiceDate === 'string' ? new Date(invoice.invoiceDate).toLocaleDateString() : invoice.invoiceDate.toLocaleDateString()) : "-"}</Table.Td>
                    <Table.Td>₹{basicAmount.toFixed(2)}</Table.Td>
                    <Table.Td>₹{gstAmount.toFixed(2)}</Table.Td>
                    <Table.Td>₹{totalAmount.toFixed(2)}</Table.Td>
                    <Table.Td>₹{totalDeduction.toFixed(2)}</Table.Td>
                    <Table.Td>₹{netPayable.toFixed(2)}</Table.Td>
                    <Table.Td>₹{amountPaid.toFixed(2)}</Table.Td>
                    <Table.Td>₹{balance.toFixed(2)}</Table.Td>
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
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </Card>

        <Text c="dimmed" size="xs" ta="center" mb="md" mt="lg">
          &copy; 2025 Annu Projects. All rights reserved.
        </Text>

      </Container>
    </Box>
  );
};

export default React.memo(Dashboard2);