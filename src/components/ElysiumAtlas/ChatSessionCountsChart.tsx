"use client";

import { useCallback, useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { cn } from "cn";
import { toast } from "sonner";
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
  type ChartConfig,
} from "@/components/ui/chart";
import {
  CustomTabs,
  CustomTabsList,
  CustomTabsTrigger,
} from "@/components/ui/CustomTabs";
import { fetchChatSessionCounts } from "@/utils/dashboardApi";
import type {
  DashboardDateRange,
  DashboardGranularity,
} from "@/types/dashboard";

const RANGE_OPTIONS: { value: DashboardDateRange; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "last_7_days", label: "Last 7 days" },
  { value: "last_30_days", label: "Last 30 days" },
  { value: "last_365_days", label: "Last 12 months" },
];

const SERENE_PURPLE_LIGHT =
  "color-mix(in srgb, var(--color-serene-purple) 55%, white)";

const chartConfig = {
  count: {
    label: "New sessions",
    color: "var(--color-serene-purple)",
  },
  visitor_message_count: {
    label: "Visitor messages",
    color: SERENE_PURPLE_LIGHT,
  },
} satisfies ChartConfig;

interface ChatSessionCountsChartProps {
  agentId?: string;
}

type ChartPoint = {
  date: string;
  label: string;
  count: number;
  visitor_message_count: number;
};

function formatChartDate(date: string, granularity: DashboardGranularity) {
  if (granularity === "month") {
    const [year, month] = date.split("-");
    const parsed = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
    return parsed.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  }

  const parsed = new Date(`${date}T00:00:00.000Z`);
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function formatChartTick(date: string, granularity: DashboardGranularity) {
  if (granularity === "month") {
    const [, month] = date.split("-");
    const parsed = new Date(Date.UTC(2000, Number(month) - 1, 1));
    return parsed.toLocaleDateString("en-US", {
      month: "short",
      timeZone: "UTC",
    });
  }

  const parsed = new Date(`${date}T00:00:00.000Z`);
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function getRangeLabel(range: DashboardDateRange) {
  return RANGE_OPTIONS.find((option) => option.value === range)?.label ?? range;
}

export default function ChatSessionCountsChart({
  agentId,
}: ChatSessionCountsChartProps) {
  const [range, setRange] = useState<DashboardDateRange>("last_7_days");
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalVisitorMessages, setTotalVisitorMessages] = useState(0);
  const [granularity, setGranularity] = useState<DashboardGranularity>("day");
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadChartData = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetchChatSessionCounts({
        range,
        ...(agentId ? { agent_id: agentId } : {}),
      });

      if (!response.success) {
        toast.error("Failed to load dashboard data.");
        setChartData([]);
        setTotalSessions(0);
        setTotalVisitorMessages(0);
        return;
      }

      setTotalSessions(response.total);
      setTotalVisitorMessages(response.total_visitor_messages);
      setGranularity(response.granularity);
      setChartData(
        response.points.map((point) => ({
          date: point.date,
          label: formatChartDate(point.date, response.granularity),
          count: point.count,
          visitor_message_count: point.visitor_message_count,
        })),
      );
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to load dashboard data.",
      );
      setChartData([]);
      setTotalSessions(0);
      setTotalVisitorMessages(0);
    } finally {
      setIsLoading(false);
    }
  }, [range, agentId]);

  useEffect(() => {
    loadChartData();
  }, [loadChartData]);

  const isSingleBucket = chartData.length <= 1;

  return (
    <Card className="gap-0 overflow-hidden border-gray-200 py-0 shadow-none dark:border-pure-mist">
      <CardHeader className="gap-3 px-4 pt-4 pb-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-[15px] font-semibold">
              Sessions & Visitor Messages
            </CardTitle>
            <CardDescription className="mt-0.5 text-xs">
              {getRangeLabel(range)}
            </CardDescription>
          </div>
          <div className="flex shrink-0 gap-4 text-right">
            <div>
              <div className="text-[22px] font-bold leading-none tabular-nums text-serene-purple">
                {isLoading ? "—" : totalSessions.toLocaleString()}
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">sessions</p>
            </div>
            <div>
              <div
                className="text-[22px] font-bold leading-none tabular-nums"
                style={{ color: SERENE_PURPLE_LIGHT }}
              >
                {isLoading ? "—" : totalVisitorMessages.toLocaleString()}
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">messages</p>
            </div>
          </div>
        </div>

        <CustomTabs
          value={range}
          onValueChange={(value) => setRange(value as DashboardDateRange)}
          className="min-w-0"
        >
          <CustomTabsList className="border-none">
            {RANGE_OPTIONS.map((option) => (
              <CustomTabsTrigger
                key={option.value}
                value={option.value}
                className="px-2.5 py-1 text-xs"
              >
                {option.label}
              </CustomTabsTrigger>
            ))}
          </CustomTabsList>
        </CustomTabs>
      </CardHeader>

      <CardContent className="px-3 pb-4 pt-3">
        {isLoading ? (
          <div className="flex h-[180px] items-center justify-center rounded-md bg-serene-purple/5 text-xs text-muted-foreground dark:bg-serene-purple/10">
            Loading chart...
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className={cn(
              "aspect-auto h-[180px]",
              isSingleBucket ? "mx-auto w-[240px]" : "w-full",
            )}
          >
            <BarChart
              accessibilityLayer
              data={chartData}
              barGap={isSingleBucket ? 14 : 4}
              barCategoryGap={isSingleBucket ? "30%" : "20%"}
              margin={{ top: 4, right: 4, left: -18, bottom: 0 }}
            >
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                stroke="rgba(108, 95, 141, 0.12)"
              />
              <XAxis
                dataKey="date"
                tickLine={false}
                tickMargin={8}
                axisLine={false}
                minTickGap={20}
                tick={{ fontSize: 11 }}
                padding={
                  isSingleBucket
                    ? { left: 24, right: 24 }
                    : { left: 8, right: 8 }
                }
                tickFormatter={(value) => formatChartTick(value, granularity)}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="dashed"
                    labelFormatter={(_, payload) => {
                      const item = payload?.[0]?.payload as
                        | { label?: string }
                        | undefined;
                      return item?.label ?? "";
                    }}
                  />
                }
              />
              <Bar
                dataKey="count"
                fill="var(--color-count)"
                radius={4}
                maxBarSize={isSingleBucket ? 36 : 28}
              />
              <Bar
                dataKey="visitor_message_count"
                fill="var(--color-visitor_message_count)"
                radius={4}
                maxBarSize={isSingleBucket ? 36 : 28}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
