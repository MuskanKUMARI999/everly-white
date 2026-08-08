"use client";

import { useState } from "react";
import type { SalesChartDay } from "@/lib/data/admin";
import { formatPrice } from "@/components/sections/productFormat";
import { formatDayKey } from "@/lib/format/datetime";

interface SalesChartProps {
  data: SalesChartDay[];
}

export function SalesChart({ data }: SalesChartProps) {
  const [metric, setMetric] = useState<"revenue" | "orders">("revenue");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="border border-neutral-100 bg-white p-6">
        <p className="font-body font-medium text-neutral-500">No sales data available for the last 30 days.</p>
      </div>
    );
  }

  // Calculate metrics
  const values = data.map((d) => (metric === "revenue" ? d.revenue : d.orders));
  const maxValue = Math.max(...values, 1); // Avoid division by zero
  const totalValue = values.reduce((sum, v) => sum + v, 0);

  // SVG dimensions
  const width = 800;
  const height = 300;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Map data to SVG coordinates
  const points = data.map((d, index) => {
    const x = paddingLeft + (index / (data.length - 1)) * chartWidth;
    const val = metric === "revenue" ? d.revenue : d.orders;
    const y = paddingTop + chartHeight - (val / maxValue) * chartHeight;
    return { x, y, val, date: d.date };
  });

  // Generate SVG path for line
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  // Generate SVG path for area fill
  const areaPath = `
    ${linePath} 
    L ${points[points.length - 1].x} ${paddingTop + chartHeight} 
    L ${points[0].x} ${paddingTop + chartHeight} 
    Z
  `;

  // Format dates for bottom labels (show every 5th label)
  const xLabels = points.filter((_, idx) => idx % 5 === 0 || idx === points.length - 1);

  // Format Y-axis tick values (4 steps)
  const yTicks = Array.from({ length: 4 }, (_, idx) => (maxValue / 3) * idx);

  // Pointer rather than mouse events, so the readout is reachable on a phone or tablet.
  // Touch gets tap-to-read instead of drag-to-scrub: the chart sits in a horizontal scroller,
  // so a drag has to stay free to pan it rather than being swallowed as a scrub gesture.
  const selectFromPointer = (e: React.PointerEvent<SVGSVGElement>) => {
    const svgRect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - svgRect.left;
    // Map clientX to point index
    const relativeX = clientX - (paddingLeft / width) * svgRect.width;
    const relativeWidth = (chartWidth / width) * svgRect.width;
    const percentage = relativeX / relativeWidth;
    const index = Math.round(percentage * (data.length - 1));

    // Clamped rather than discarded: a tap on the y-axis labels or just past the last point
    // should still read the nearest day instead of doing nothing.
    setHoveredIndex(Math.min(data.length - 1, Math.max(0, index)));
  };

  const activePoint = hoveredIndex !== null ? points[hoveredIndex] : null;

  return (
    <div className="flex flex-col gap-6 border border-neutral-100 bg-white p-6">
      {/* Header and Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-heading text-lg font-light uppercase tracking-widest text-neutral-500">
            Sales Performance (Last 30 Days)
          </h3>
          <p className="mt-1 font-body text-sm text-neutral-400">
            Paid orders only — pending, failed and refunded are excluded.
          </p>
          <p className="mt-1 font-body font-medium text-lg text-neutral-500">
            Total {metric === "revenue" ? "Revenue" : "Orders"}:{" "}
            <span className="font-semibold text-neutral-500">
              {metric === "revenue" ? formatPrice(totalValue) : `${totalValue} orders`}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-1 border border-neutral-200 p-0.5">
          <button
            onClick={() => {
              setMetric("revenue");
              setHoveredIndex(null);
            }}
            className={`cursor-pointer px-3 py-1 font-heading text-[12px] uppercase tracking-widest transition-colors ${
              metric === "revenue"
                ? "bg-brown text-beige-light"
                : "text-neutral-500 hover:text-neutral-600"
            }`}
          >
            Revenue
          </button>
          <button
            onClick={() => {
              setMetric("orders");
              setHoveredIndex(null);
            }}
            className={`cursor-pointer px-3 py-1 font-heading text-[12px] uppercase tracking-widest transition-colors ${
              metric === "orders"
                ? "bg-brown text-beige-light"
                : "text-neutral-500 hover:text-neutral-600"
            }`}
          >
            Orders
          </button>
        </div>
      </div>

      {/* SVG Chart Container */}
      <div className="relative w-full overflow-x-auto">
        <div className="min-w-175 w-full">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full overflow-visible select-none"
            onPointerDown={selectFromPointer}
            onPointerMove={(e) => {
              if (e.pointerType === "mouse") selectFromPointer(e);
            }}
            onPointerLeave={(e) => {
              // Only a mouse "leaves" — clearing on touch would wipe the readout the tap just set.
              if (e.pointerType === "mouse") setHoveredIndex(null);
            }}
          >
            {/* Grid lines */}
            {yTicks.map((tick, i) => {
              const y = paddingTop + chartHeight - (tick / maxValue) * chartHeight;
              return (
                <g key={i} className="opacity-40">
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={width - paddingRight}
                    y2={y}
                    stroke="#E5E7EB"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                  />
                  <text
                    x={paddingLeft - 10}
                    y={y + 4}
                    textAnchor="end"
                    className="font-body font-medium text-[13px] fill-neutral-400"
                  >
                    {metric === "revenue" ? formatPrice(tick) : Math.round(tick)}
                  </text>
                </g>
              );
            })}

            {/* Filled Area */}
            <path d={areaPath} fill="url(#colorGrad)" opacity={0.15} />

            {/* Line Path */}
            <path
              d={linePath}
              fill="none"
              stroke="#8B7B6B" // Warm Brown
              strokeWidth={1.8}
            />

            {/* X-Axis labels */}
            {xLabels.map((p, i) => (
              <g key={i}>
                <line
                  x1={p.x}
                  y1={paddingTop + chartHeight}
                  x2={p.x}
                  y2={paddingTop + chartHeight + 4}
                  stroke="#D1D5DB"
                />
                <text
                  x={p.x}
                  y={paddingTop + chartHeight + 18}
                  textAnchor="middle"
                  className="font-body font-medium text-[13px] fill-neutral-400"
                >
                  {formatDayKey(p.date)}
                </text>
              </g>
            ))}

            {/* Hover tooltip vertical line */}
            {activePoint && (
              <line
                x1={activePoint.x}
                y1={paddingTop}
                x2={activePoint.x}
                y2={paddingTop + chartHeight}
                stroke="#B89088" // Terracotta shade
                strokeWidth={1}
                strokeDasharray="3 3"
              />
            )}

            {/* Hover Points */}
            {points.map((p, i) => {
              const isHovered = hoveredIndex === i;
              return (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 4.5 : 2}
                  fill={isHovered ? "#B89088" : "#8B7B6B"}
                  stroke={isHovered ? "#FFFFFF" : "none"}
                  strokeWidth={isHovered ? 1.5 : 0}
                  className="transition-all duration-100"
                />
              );
            })}

            {/* Gradients */}
            <defs>
              <linearGradient id="colorGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B7B6B" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#8B7B6B" stopOpacity={0.0} />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Floating details tooltip when hovered */}
      {activePoint && (
        <div className="flex flex-wrap justify-between items-center gap-x-4 gap-y-1 bg-neutral-50 px-4 py-2 border border-neutral-100">
          <p className="font-body font-medium text-lg text-neutral-500">
            Date:{" "}
            <span className="font-semibold text-neutral-500">
              {formatDayKey(activePoint.date, {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </p>
          <p className="font-body font-medium text-lg text-neutral-500">
            {metric === "revenue" ? "Revenue: " : "Orders: "}
            <span className="font-semibold text-neutral-500">
              {metric === "revenue" ? formatPrice(activePoint.val) : `${activePoint.val} orders`}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
