import {
  IconArrowDownRight,
  IconArrowUpRight,
  IconFileInvoice,
  IconX,
  IconClockHour4,
  IconNote,
} from "@tabler/icons-react";
import { Group, Paper, SimpleGrid, Text, ThemeIcon, Modal, Stack, type DefaultMantineColor } from "@mantine/core";
import CountUp from "react-countup";
import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { notifyError } from "../../lib/utils/notify";
import { DonutChart } from "@mantine/charts";
import { motion } from "framer-motion";

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

export default function InvoiceStatusStats() {
  const [statsData, setStatsData] = useState<Stat[]>(defaultData);
  const [invoices, setInvoices] = useState<Record<string, unknown>[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [chartData, setChartData] = useState<{ name: string; value: number; color: DefaultMantineColor }[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

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
          { title: "Cancelled", value: cancelled, diff: 0, icon: IconX, color: "red" },
          { title: "Under Process", value: under, diff: 0, icon: IconClockHour4, color: "yellow" },
          { title: "Credit Note Issued", value: credit, diff: 0, icon: IconNote, color: "blue" },
        ];

  setStatsData(newStats);
  setInvoices(invoices);
      } catch (error) {
        console.error("Failed to fetch invoices:", error);
        notifyError("Failed to fetch invoice stats");
      }
    };

    fetchStats();
  }, []);

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

  const colorPool: DefaultMantineColor[] = ["teal", "blue", "yellow", "red", "gray"];
      const dataArr = Object.entries(counts).map(([name, value], idx) => ({
        name,
        value,
        color: colorPool[idx % colorPool.length],
      }));

      setChartData(dataArr.length > 0 ? dataArr : [{ name: "No data", value: 1, color: "gray" }]);
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
    <Group gap="xs">
      <ThemeIcon color="teal" size="md" radius="xl" variant="light">
        <IconFileInvoice size={18} />
      </ThemeIcon>
      <Text fw={700}>
        {selectedStatus ? `${selectedStatus} — Project-wise Summary` : "Details"}
      </Text>
    </Group>
  }
  size="lg"
  centered
  overlayProps={{
    blur: 3,
    opacity: 0.55,
  }}
  radius="md"
  transitionProps={{ transition: "fade", duration: 200 }}
>
  {chartData.length > 0 ? (
    <Group
      justify="center"
      align="flex-start"
      gap="xl"
      wrap="nowrap"
      style={{
        padding: "1rem",
      }}
    >
      <Paper
        withBorder
        radius="md"
        p="md"
        shadow="sm"
        style={{
          background:
            "radial-gradient(circle at 20% 20%, rgba(0,0,0,0.02), transparent)",
        }}
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          whileHover={{ scale: 1.03 }}
          style={{ display: "inline-block" }}
          key={selectedStatus ?? "chart"}
        >
          <DonutChart
            data={chartData}
            withLabels
            size={240}
            thickness={36}
            strokeWidth={2}
            tooltipDataSource="segment"
          />
        </motion.div>
      </Paper>

      <Stack gap="xs" justify="center" style={{ minWidth: 200 }}>
        {chartData.map((c) => (
          <Group
            key={c.name}
            gap="sm"
            align="center"
            style={{
              padding: "0.5rem 0.75rem",
              borderRadius: "8px",
              backgroundColor: "rgba(0,0,0,0.03)",
            }}
          >
            <ThemeIcon color={c.color} size="sm" radius="xl" />
            <Text fw={600} style={{ flexGrow: 1 }}>
              {c.name}
            </Text>
            <Text c="dimmed" fw={500}>
              {c.value}
            </Text>
          </Group>
        ))}
      </Stack>
    </Group>
  ) : (
    <Stack align="center" py="xl">
      <IconX size={40} color="gray" />
      <Text c="dimmed">No data available for this status</Text>
    </Stack>
  )}
</Modal>

    </div>
  );
}
