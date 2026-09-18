"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DayPoint {
  label: string;
  count: number;
}

const W = 560;
const H = 170;
const PAD_X = 8;
const PAD_TOP = 16;
const PAD_BOTTOM = 26;

/** Catmull-Rom → cubic bezier for a smooth line through all points. */
function smoothPath(pts: [number, number][]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(i + 2, pts.length - 1)];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
  }
  return d;
}

export function TrafficChart({
  data,
  last7,
  delta,
}: {
  data: DayPoint[];
  last7: number;
  delta: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const max = Math.max(...data.map((d) => d.count), 1);
  const innerW = W - PAD_X * 2;
  const innerH = H - PAD_TOP - PAD_BOTTOM;
  const pts: [number, number][] = data.map((d, i) => [
    PAD_X + (i / Math.max(data.length - 1, 1)) * innerW,
    PAD_TOP + (1 - d.count / max) * innerH,
  ]);
  const line = smoothPath(pts);
  const area = `${line} L ${pts[pts.length - 1][0]},${PAD_TOP + innerH} L ${pts[0][0]},${PAD_TOP + innerH} Z`;

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const idx = Math.round(((x - PAD_X) / innerW) * (data.length - 1));
    setHover(Math.min(Math.max(idx, 0), data.length - 1));
  };

  const active = hover != null ? data[hover] : null;
  const deltaUp = delta > 0;
  const deltaDown = delta < 0;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-[12px] font-semibold tabular-nums text-neutral-700">
          {last7.toLocaleString()} views this week
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-semibold tabular-nums",
            deltaUp && "bg-[#F7EFD4] text-[#8C6D1F]",
            deltaDown && "bg-rose-50 text-rose-600",
            !deltaUp && !deltaDown && "bg-neutral-100 text-neutral-500"
          )}
        >
          {deltaUp ? <TrendingUp className="h-3 w-3" /> : deltaDown ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
          {deltaUp ? "+" : ""}
          {delta}% vs prior week
        </span>
      </div>

      <div ref={wrapRef} className="relative mt-4">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          role="img"
          aria-label="Listing views over the last 14 days"
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id="traffic-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(201 162 39)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="rgb(201 162 39)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* grid lines */}
          {[0.25, 0.5, 0.75].map((f) => (
            <line
              key={f}
              x1={PAD_X}
              x2={W - PAD_X}
              y1={PAD_TOP + innerH * f}
              y2={PAD_TOP + innerH * f}
              stroke="rgb(0 0 0 / 0.05)"
              strokeDasharray="3 5"
            />
          ))}

          <motion.path
            d={area}
            fill="url(#traffic-fill)"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.3 }}
          />
          <motion.path
            d={line}
            fill="none"
            stroke="rgb(168 133 29)"
            strokeWidth="2.5"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.1, ease: "easeOut" }}
          />

          {/* end dot */}
          <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="4" fill="rgb(168 133 29)" />
          <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="8" fill="rgb(168 133 29)" opacity="0.15" />

          {/* hover guide */}
          {hover != null && (
            <g>
              <line
                x1={pts[hover][0]}
                x2={pts[hover][0]}
                y1={PAD_TOP - 4}
                y2={PAD_TOP + innerH + 4}
                stroke="rgb(10 10 10 / 0.18)"
                strokeWidth="1"
              />
              <circle cx={pts[hover][0]} cy={pts[hover][1]} r="4.5" fill="white" stroke="rgb(168 133 29)" strokeWidth="2.5" />
            </g>
          )}

          {/* x labels: first / middle / last */}
          {[0, Math.floor(data.length / 2), data.length - 1].map((i) => (
            <text
              key={i}
              x={pts[i][0]}
              y={H - 8}
              textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"}
              className="fill-neutral-400"
              fontSize="10.5"
            >
              {data[i].label}
            </text>
          ))}
        </svg>

        {/* tooltip */}
        {active && hover != null && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-neutral-900 px-2.5 py-1.5 text-center text-white shadow-lg"
            style={{
              left: `${(pts[hover][0] / W) * 100}%`,
              top: `${(pts[hover][1] / H) * 100}%`,
              marginTop: -10,
            }}
          >
            <p className="text-[10.5px] font-medium leading-none text-neutral-300">{active.label}</p>
            <p className="mt-1 text-[12px] font-semibold leading-none tabular-nums">
              {active.count} {active.count === 1 ? "view" : "views"}
            </p>
          </div>
        )}
      </div>

      <p className="mt-3 text-[11.5px] text-neutral-400">
        Hover the chart for daily numbers — every listing page view is counted, including yours.
      </p>
    </div>
  );
}
