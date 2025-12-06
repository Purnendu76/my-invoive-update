import { Card, Text, Group, Title, ThemeIcon, Stack } from "@mantine/core";
import { DonutChart } from "@mantine/charts";
import { IconFileInvoice } from "@tabler/icons-react";
import { motion } from "framer-motion";
import "@mantine/charts/styles.css";
import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";

const projects = [
  "NFS",
  "GAIL",
  "BGCL",
  "STP",
  "BHARAT NET",
  "NFS AMC",
];

const projectColors = [
  "teal.6",
  "blue.6",
  "yellow.6",
  "red.6",
  "gray.6",
  "violet.6",
];

const MotionDonutChart = motion(DonutChart);

interface InvoiceDonutData {
  name: string;
  value: number;
  color: string;
}

export default function InvoiceDonutChart() {
  const [invoiceData, setInvoiceData] = useState<InvoiceDonutData[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const token = Cookies.get("token");
        const res = await axios.get("/api/v1/invoices", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const invoices = Array.isArray(res.data) ? res.data : [];
        setTotal(invoices.length);
        // Log all API data
        console.log("Fetched invoices:", invoices);

        // Group by project
        const counts: Record<string, number> = {};
        projects.forEach((p) => { counts[p] = 0; });
        invoices.forEach((inv) => {
          const proj = inv.project;
          if (Array.isArray(proj)) {
            proj.forEach((p) => {
              const key = projects.find((name) => name.toLowerCase() === String(p).trim().toLowerCase());
              if (key) counts[key]++;
            });
          } else {
            const key = projects.find((name) => name.toLowerCase() === String(proj).trim().toLowerCase());
            if (key) counts[key]++;
          }
        });
        // Log grouped project counts
        console.log("Project invoice counts:", counts);

        const data: InvoiceDonutData[] = projects.map((p, i) => ({
          name: p,
          value: counts[p],
          color: projectColors[i % projectColors.length],
        }));
        setInvoiceData(data);
      } catch {
        setInvoiceData([]);
        setTotal(0);
      }
    };
    fetchInvoices();
  }, []);

  return (
    <Card shadow="lg" radius="lg" p="xl" withBorder>
      {/* Header */}
      <Group mb="md">
        <ThemeIcon variant="light" color="blue" size="lg" radius="xl">
          <IconFileInvoice size={20} />
        </ThemeIcon>
        <div>
          <Title order={4}>Project Invoice Overview</Title>
          <Text size="sm" c="dimmed">
            Total invoices: {total}
          </Text>
        </div>
      </Group>

      {/* Animated Chart */}
      <Group justify="center">
        <MotionDonutChart
          data={invoiceData}
          tooltipDataSource="segment"
          withLabels
          size={205}
          thickness={30}
          mx="auto"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </Group>

      {/* Legend */}
      <Group justify="space-around" mt="lg">
        {invoiceData.map((item: InvoiceDonutData) => (
          <Group key={item.name} gap="xs">
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                backgroundColor: `var(--mantine-color-${item.color.replace(
                  ".",
                  "-"
                )})`,
              }}
            />
            <Stack gap={0} align="start">
              <Text fz="sm" fw={500}>
                {item.name}
              </Text>
              <Text fz="xs" c="dimmed">
                {item.value} invoices
              </Text>
            </Stack>
          </Group>
        ))}
      </Group>
    </Card>
  );
}
