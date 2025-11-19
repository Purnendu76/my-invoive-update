import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
import { Card, Title, Text, Group, ThemeIcon } from "@mantine/core";
import { IconChartLine } from "@tabler/icons-react";

const data = [
  { date: "2025-08-20", revenue: 2000, invoices: 12 },
  { date: "2025-08-21", revenue: 3500, invoices: 18 },
  { date: "2025-08-22", revenue: 4200, invoices: 20 },
  { date: "2025-08-23", revenue: 3100, invoices: 15 },
  { date: "2025-08-24", revenue: 5400, invoices: 25 },
  { date: "2025-08-25", revenue: 6100, invoices: 28 },
  { date: "2025-08-26", revenue: 7200, invoices: 32 },
];

export default function InvoiceLineChart() {
  return (
    <Card withBorder shadow="lg" radius="lg" p="xl">
      <Group mb="md">
        <ThemeIcon variant="light" color="indigo" size="lg" radius="xl">
          <IconChartLine size={20} />
        </ThemeIcon>
        <div>
          <Title order={4}>Invoice Trends</Title>
          <Text size="sm" c="dimmed">
            Daily Revenue & Invoice Count
          </Text>
        </div>
      </Group>

      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis yAxisId="left" label={{ value: "Revenue ($)", angle: -90, position: "insideLeft" }} />
          <YAxis yAxisId="right" orientation="right" label={{ value: "Invoices", angle: -90, position: "insideRight" }} />
          <Tooltip />
          <Legend />

          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#228be6"
            strokeWidth={3}
            yAxisId="left"
            dot={false}
            isAnimationActive={true}
            animationDuration={2000}
            animationEasing="ease-in-out"
          />
          <Line
            type="monotone"
            dataKey="invoices"
            stroke="#20c997"
            strokeWidth={3}
            yAxisId="right"
            dot={false}
            isAnimationActive={true}
            animationDuration={2000}
            animationBegin={500}
            animationEasing="ease-in-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
