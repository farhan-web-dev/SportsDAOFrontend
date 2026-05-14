"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { FileText, Vote, CheckCircle, Clock } from "lucide-react";

// Static data for charts
const reportsData = [
  // { month: "Jan", pending: 12, approved: 8, rejected: 2 },
  // { month: "Feb", pending: 15, approved: 10, rejected: 3 },
  // { month: "Mar", pending: 18, approved: 12, rejected: 4 },
  // { month: "Apr", pending: 14, approved: 15, rejected: 2 },
  { month: "Nov", pending: 4, approved: 2, rejected: 3 },
  { month: "Dec", pending: 1, approved: 7, rejected: 5 },
];

const proposalsData = [
  // { month: "Jan", active: 5, executed: 3, defeated: 1 },
  // { month: "Feb", active: 7, executed: 4, defeated: 2 },
  // { month: "Mar", active: 6, executed: 5, defeated: 1 },
  // { month: "Apr", active: 8, executed: 6, defeated: 2 },
  { month: "Nov", active: 9, executed: 7, defeated: 1 },
  { month: "Dec", active: 10, executed: 8, defeated: 2 },
];

const statusData = [
  { name: "Active", value: 19, color: "hsl(var(--chart-1))" },
  { name: "Executed", value: 15, color: "hsl(var(--chart-2))" },
  { name: "Defeated", value: 3, color: "hsl(var(--chart-3))" },
  { name: "Pending", value: 5, color: "hsl(var(--chart-4))" },
];

const chartConfig = {
  pending: {
    label: "Pending",
    color: "hsl(var(--chart-1))",
  },
  approved: {
    label: "Approved",
    color: "hsl(var(--chart-2))",
  },
  rejected: {
    label: "Rejected",
    color: "hsl(var(--chart-3))",
  },
  active: {
    label: "Active",
    color: "hsl(var(--chart-1))",
  },
  executed: {
    label: "Executed",
    color: "hsl(var(--chart-2))",
  },
  defeated: {
    label: "Defeated",
    color: "hsl(var(--chart-3))",
  },
};

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of reports and proposals
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">20</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Reports
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Proposals
            </CardTitle>
            <Vote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Executed Proposals
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">17</div>
            <p className="text-xs text-muted-foreground">
              Successfully executed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Reports Overview</CardTitle>
            <CardDescription>Monthly report statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <BarChart data={reportsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="pending" fill="var(--color-pending)" />
                <Bar dataKey="approved" fill="var(--color-approved)" />
                <Bar dataKey="rejected" fill="var(--color-rejected)" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Proposals Trend</CardTitle>
            <CardDescription>Monthly proposal activity</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <LineChart data={proposalsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="active"
                  stroke="var(--color-active)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="executed"
                  stroke="var(--color-executed)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="defeated"
                  stroke="var(--color-defeated)"
                  strokeWidth={2}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Proposal Status Distribution</CardTitle>
          <CardDescription>Current status breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
