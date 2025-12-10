import {
  IconArrowDownRight,
  IconArrowUpRight,
  IconFileInvoice,
  IconX,
  IconClockHour4,
  IconNote,
  IconChartPie,
} from "@tabler/icons-react";
import {
  Group,
  Paper,
  SimpleGrid,
  Text,
  ThemeIcon,
  Modal,
  Stack,
  Box,
  ScrollArea,
  Center,
  Divider,
  type DefaultMantineColor,
} from "@mantine/core";
import CountUp from "react-countup";
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { DonutChart } from "@mantine/charts";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

type Stat = {
  title: string;
  value: number;
  diff: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: React.ComponentType<any>;
  color: string;
};

const defaultData: Stat[] = [
  { title: "Paid", value: 0, diff: 0, icon: IconFileInvoice, color: "teal" },
  { title: "Cancelled", value: 0, diff: 0, icon: IconX, color: "red" },
  { title: "Under Process", value: 0, diff: 0, icon: IconClockHour4, color: "yellow" },
  { title: "Credit Note Issued", value: 0, diff: 0, icon: IconNote, color: "blue" },
];

// Animation variants for the list
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export default function InvoiceStatusStats() {
  const [statsData, setStatsData] = useState<Stat[]>(defaultData);
  const [invoices, setInvoices] = useState<Record<string, unknown>[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [chartData, setChartData] = useState<{ name: string; value: number; color: DefaultMantineColor }[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = Cookies.get("token");
        const res = await axios.get("/api/v1/invoices", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const invoices = Array.isArray(res.data) ? res.data : [];

        let paid = 0,
          cancelled = 0,
          under = 0,
          credit = 0;

        invoices.forEach((inv: Record<string, unknown>) => {
          const s = String((inv && inv.status) ? inv.status : "").toLowerCase();
          if (!s) return;
          if (s.includes("paid")) paid += 1;
          else if (s.includes("cancel")) cancelled += 1;
          else if (s.includes("under")) under += 1;
          else if (s.includes("credit")) credit += 1;
        });

        const newStats: Stat[] = [
          { title: "Paid", value: paid, diff: 0, icon: IconFileInvoice, color: "teal" },
          { title: "Under Process", value: under, diff: 0, icon: IconClockHour4, color: "yellow" },
          { title: "Credit Note Issued", value: credit, diff: 0, icon: IconNote, color: "blue" },
          { title: "Cancelled", value: cancelled, diff: 0, icon: IconX, color: "red" },
        ];

        setStatsData(newStats);
        setInvoices(invoices);
      } catch (error) {
        console.error("Failed to fetch invoices:", error);
      }
    };

    fetchStats();
  }, []);

  // Calculate total for the center label
  const totalChartValue = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.value, 0);
  }, [chartData]);

  const stats = statsData.map((stat) => {
    const DiffIcon = stat.diff >= 0 ? IconArrowUpRight : IconArrowDownRight;

    const handleClick = () => {
      const counts: Record<string, number> = {};
      invoices.forEach((inv: Record<string, unknown>) => {
        const s = String(inv.status ? inv.status : "").toLowerCase();
        if (!s) return;
        const matches =
          (stat.title === "Paid" && s.includes("paid")) ||
          (stat.title === "Cancelled" && s.includes("cancel")) ||
          (stat.title === "Under Process" && s.includes("under")) ||
          (stat.title === "Credit Note Issued" && s.includes("credit"));
        if (!matches) return;

        const proj = inv.project as unknown;
        if (Array.isArray(proj)) {
          (proj as unknown[]).forEach((p) => {
            const name = p ? String(p) : "Unknown";
            counts[name] = (counts[name] || 0) + 1;
          });
        } else {
          const name = proj ? String(proj) : "Unknown";
          counts[name] = (counts[name] || 0) + 1;
        }
      });

      // Expanded color palette for better aesthetics
      const colorPool: DefaultMantineColor[] = [
        "teal.6", "blue.6", "indigo.6", "violet.6", "grape.6", 
        "pink.6", "red.6", "orange.6", "yellow.6", "lime.6", "cyan.6"
      ];
      
      const dataArr = Object.entries(counts)
        .sort(([, a], [, b]) => b - a) // Sort by value descending
        .map(([name, value], idx) => ({
          name,
          value,
          color: colorPool[idx % colorPool.length],
        }));

      setChartData(dataArr.length > 0 ? dataArr : [{ name: "No data", value: 1, color: "gray.3" }]);
      setSelectedStatus(stat.title);
      setModalOpen(true);
    };

    return (
      <Paper withBorder p="md" radius="md" key={stat.title} style={{ cursor: "pointer" }} onClick={handleClick}>
        <Group justify="apart">
          <div>
            <Text c="dimmed" tt="uppercase" fw={700} fz="xs">
              {stat.title}
            </Text>
            <Group gap="xs" align="center">
              <Text fz="xl" fw={700}>
                <CountUp start={0} end={stat.value} duration={1.5} separator="," />
              </Text>
              <DiffIcon
                size={20}
                stroke={1.5}
                color={stat.diff > 0 ? "teal" : "red"}
              />
            </Group>
          </div>
          <ThemeIcon
            variant="light"
            color={stat.color}
            size={38}
            radius="md"
          >
            <stat.icon size={26} stroke={1.5} />
          </ThemeIcon>
        </Group>
        <Text c="dimmed" fz="sm" mt="md">
          <Text
            component="span"
            c={stat.diff > 0 ? "teal" : "red"}
            fw={700}
          >
            {stat.diff}%
          </Text>{" "}
          {stat.diff > 0 ? "increase" : "decrease"} compared to last month
        </Text>
      </Paper>
    );
  });

  return (
    <div>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>{stats}</SimpleGrid>

      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          <Group gap="sm" style={{paddingLeft:'18px'}}>
             <ThemeIcon size="lg"  variant="gradient" gradient={{ from: 'blue', to: 'cyan', deg: 90 }}>
                <IconChartPie size={20} />
             </ThemeIcon>
             <Box >
                <Text fw={700} size="lg" lh={1.2} >Project Breakdown</Text>
                <Text size="xs" c="dimmed" fw={500}>{selectedStatus} Invoices</Text>
             </Box>
          </Group>
        }
        size="lg"
        centered
        padding={0} // Custom padding handling
        radius="lg"
        transitionProps={{ transition: "pop", duration: 200 }}
      >
        {chartData.length > 0 && chartData[0].name !== "No data" ? (
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={0}>
            
            {/* Left Side: Chart Section */}
            <Box 
              p="xl" 
              bg="gray.0" 
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
            >
              <Box pos="relative">
                <DonutChart
                  data={chartData}
                  withLabelsLine
                  withLabels
                  size={226}
                    withTooltip={false} 
                  thickness={25}
                  paddingAngle={2}
                  strokeWidth={0}
                  // chartLabel={selectedStatus || "Total"}
                />
                {/* Center Label Overlay */}
                <Center 
                  style={{ 
                    position: 'absolute', 
                    top: 0, left: 0, right: 0, bottom: 0, 
                    pointerEvents: 'none' 
                  }}
                >
                  <Stack gap={0} align="center">
                    <Text fz={28} fw={800} lh={1}>
                      {totalChartValue}
                    </Text>
                    <Text fz="xs" fw={600} c="dimmed" tt="uppercase">
                      Total
                    </Text>
                  </Stack>
                </Center>
              </Box>
            </Box>

            {/* Right Side: Legend / List Section */}
            <Box p="md">
               <Text fz="sm" fw={600} c="dimmed" mb="sm">
                 Projects ({chartData.length})
               </Text>
               <Divider mb="sm" />
               <ScrollArea h={300} type="auto" offsetScrollbars>
                  <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                  >
                    <Stack gap="xs">
                      {chartData.map((c) => (
                        <motion.div variants={itemVariants} key={c.name} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Group
                            wrap="nowrap"
                            onClick={() => {
                              if(selectedStatus) {
                                navigate(`/select-status?status=${encodeURIComponent(selectedStatus)}&project=${encodeURIComponent(c.name)}`);
                              }
                            }}
                            style={{
                              padding: "10px 12px",
                              borderRadius: "8px",
                              backgroundColor: "var(--mantine-color-body)",
                              border: "1px solid var(--mantine-color-gray-2)",
                              cursor: "pointer",
                            }}
                          >
                            <ThemeIcon color={c.color} variant="light" size="md" radius="md">
                                <IconFileInvoice size={16} />
                            </ThemeIcon>
                            
                            <Box style={{ flex: 1, overflow: "hidden" }}>
                              <Text size="sm" fw={600} truncate>
                                {c.name}
                              </Text>
                              <Group gap={6}>
                                <Text size="xs" c="dimmed">
                                  {((c.value / totalChartValue) * 100).toFixed(1)}%
                                </Text>
                              </Group>
                            </Box>

                            <Text fw={700} size="sm">
                              {c.value}
                            </Text>
                          </Group>
                        </motion.div>
                      ))}
                    </Stack>
                  </motion.div>
               </ScrollArea>
            </Box>
          </SimpleGrid>
        ) : (
          <Stack align="center" justify="center" h={300} bg="gray.0">
            <IconX size={48} color="gray" style={{ opacity: 0.3 }} />
            <Text c="dimmed" size="lg">No project data found</Text>
          </Stack>
        )}
      </Modal>
    </div>
  );
}