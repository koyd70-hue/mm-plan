"use client";

interface DeltaCellProps {
  currentValue: number;
  previousValue: number;
  delta: number;
}

export default function DeltaCell({
  currentValue,
  previousValue,
  delta,
}: DeltaCellProps) {
  const round2 = (n: number) => Math.round(n * 100) / 100;
  const displayDelta = round2(delta);

  return (
    <div className="px-2 py-1 text-right text-sm">
      <div className="font-medium">{round2(currentValue) || "-"}</div>
      {previousValue !== currentValue && (
        <div className="flex items-center justify-end gap-1 text-xs">
          <span className="text-gray-400">{round2(previousValue) || "0"}</span>
          {displayDelta !== 0 && (
            <span
              className={`font-medium ${
                displayDelta > 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              ({displayDelta > 0 ? "+" : ""}
              {displayDelta})
            </span>
          )}
        </div>
      )}
    </div>
  );
}
