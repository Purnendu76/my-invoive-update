import { Card, Title } from "@mantine/core";
import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const defaultRevenueData = [
  { state: "West Bengal", Paid: 0, Cancelled: 0, UnderProcess: 0, CreditNote: 0 },
  { state: "Delhi", Paid: 0, Cancelled: 0, UnderProcess: 0, CreditNote: 0 },
  { state: "Bihar", Paid: 0, Cancelled: 0, UnderProcess: 0, CreditNote: 0 },
  { state: "MP", Paid: 0, Cancelled: 0, UnderProcess: 0, CreditNote: 0 },
  { state: "Kerala", Paid: 0, Cancelled: 0, UnderProcess: 0, CreditNote: 0 },
  { state: "Sikkim", Paid: 0, Cancelled: 0, UnderProcess: 0, CreditNote: 0 },
  { state: "Jharkhand", Paid: 0, Cancelled: 0, UnderProcess: 0, CreditNote: 0 },
  { state: "Andaman", Paid: 0, Cancelled: 0, UnderProcess: 0, CreditNote: 0 },
];

export default function RevenueStatusChart() {
  const [revenueData, setRevenueData] = useState(defaultRevenueData);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const token = Cookies.get("token");
        const res = await axios.get("/api/v1/invoices", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const invoices = Array.isArray(res.data) ? res.data : [];

        // Initialize map with known states so order is predictable
        const stateMap: Record<string, { Paid: number; Cancelled: number; UnderProcess: number; CreditNote: number }> = {};
        defaultRevenueData.forEach((row) => {
          stateMap[row.state] = { Paid: 0, Cancelled: 0, UnderProcess: 0, CreditNote: 0 };
        });

        // Normalization helper to map variants to canonical names
        const normalizeState = (raw?: unknown): string => {
          if (!raw) return "Unknown";
          const s = String(raw).toLowerCase().trim();
          const map: Record<string, string> = {
            "west bengal": "West Bengal",
            // "westbengal": "West Bengal",
            "delhi": "Delhi",
            "bihar": "Bihar",
            "mp": "MP",
            "madhya pradesh": "MP",
            "kerala": "Kerala",
            "sikkim": "Sikkim",
            "jharkhand": "Jharkhand",
            "andaman": "Andaman",
          };

          if (map[s]) return map[s];
          const first = s.split(/[,-]/)[0].trim();
          if (map[first]) return map[first];
          return first
            .split(" ")
            .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
            .join(" ");
        };

        invoices.forEach((inv: Record<string, unknown>) => {
          // Sometimes state might be in inv.state or inv.project; normalize both
          const rawState = inv.state ?? inv["project"] ?? "Unknown";
          const state = normalizeState(rawState);
          const status = inv.status ? String(inv.status).toLowerCase() : "";
          const amount = Number(inv.totalAmount ?? 0) || 0;

          if (!stateMap[state]) {
            // ensure unexpected-but-valid states still show up
            stateMap[state] = { Paid: 0, Cancelled: 0, UnderProcess: 0, CreditNote: 0 };
          }

          if (status.includes("paid")) stateMap[state].Paid += amount;
          else if (status.includes("cancel")) stateMap[state].Cancelled += amount;
          else if (status.includes("under")) stateMap[state].UnderProcess += amount;
          else if (status.includes("credit")) stateMap[state].CreditNote += amount;
        });

  // Debugging: show API and aggregated results (remove in production)
  console.debug("Fetched invoices:", invoices.slice(0, 10));
  console.debug("Aggregated stateMap:", stateMap);

        setRevenueData(
          Object.entries(stateMap).map(([state, row]) => ({
            state,
            ...row,
          }))
        );
      } catch (error) {
        console.error("Failed to fetch invoices for revenue chart:", error);
        // fallback: keep default data
        setRevenueData(defaultRevenueData);
      }
    };

    fetchInvoices();
  }, []);

  return (
    <Card shadow="lg" radius="lg" p="xl" withBorder style={{ overflowX: "auto" }}>
      <Title order={3} mb="lg" style={{ color: "#1e3a8a" }}>
        📊 State-wise Revenue Status
      </Title>

      <ResponsiveContainer width="100%" height={360}>
        <BarChart
          data={revenueData}
          margin={{ top: 20, right: 40, left: 20, bottom: 60 }}
          barCategoryGap="15%"
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="state"
            angle={-30}
            textAnchor="end"
            interval={0}
            height={60}
          />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="Paid" stackId="a" fill="#14b8a6" animationDuration={1500} />
          <Bar dataKey="Cancelled" stackId="a" fill="#ef4444" animationDuration={1500} />
          <Bar dataKey="UnderProcess" stackId="a" fill="#eab308" animationDuration={1500} />
          <Bar dataKey="CreditNote" stackId="a" fill="#3b82f6" animationDuration={1500} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
