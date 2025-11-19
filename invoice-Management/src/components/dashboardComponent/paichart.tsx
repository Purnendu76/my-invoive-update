import { Card, Text, Group, Title, ThemeIcon, Stack } from "@mantine/core";
import { DonutChart } from "@mantine/charts";
import { IconFileInvoice } from "@tabler/icons-react";
import { motion } from "framer-motion";
import "@mantine/charts/styles.css";

const invoiceData = [
  { name: "Paid", value: 45, color: "teal.6" },
  { name: "Pending", value: 25, color: "yellow.6" },
  { name: "Overdue", value: 20, color: "red.6" },
  { name: "Cancelled", value: 10, color: "gray.5" },
];

// Wrap DonutChart with framer-motion
const MotionDonutChart = motion(DonutChart);

export default function InvoiceDonutChart() {
  return (
    <Card shadow="lg" radius="lg" p="xl" withBorder>
      {/* Header */}
      <Group mb="md">
        <ThemeIcon variant="light" color="blue" size="lg" radius="xl">
          <IconFileInvoice size={20} />
        </ThemeIcon>
        <div>
          <Title order={4}>Invoice Status Overview</Title>
          <Text size="sm" c="dimmed">
            Distribution of invoices by status
          </Text>
        </div>
      </Group>

      {/* Animated Chart */}
      <Group justify="center">
        <MotionDonutChart
          data={invoiceData}
          tooltipDataSource="segment"
          withLabels
          size={190}
          thickness={30}
          mx="auto"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </Group>

      {/* Legend */}
      <Group justify="space-around" mt="lg">
        {invoiceData.map((item) => (
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
                {item.value}%
              </Text>
            </Stack>
          </Group>
        ))}
      </Group>
    </Card>
  );
}
