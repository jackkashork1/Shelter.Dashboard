"use client";

const FILTERS = [
  { value: "all", label: "All Shelters" },
  { value: "low-barrier", label: "Low Barrier" },
  { value: "high-barrier", label: "High Barrier" },
  { value: "inclement-only", label: "Inclement Only" },
  { value: "families", label: "Families" },
  { value: "women", label: "Women" },
  { value: "men", label: "Men" },
  { value: "youth", label: "Youth" },
  { value: "lgbtq", label: "LGBTQIA+" },
  { value: "dv", label: "Domestic Violence" },
] as const;

type FilterValue = (typeof FILTERS)[number]["value"];

export default function FilterBar({
  active,
  onChange,
}: {
  active: FilterValue;
  onChange: (v: FilterValue) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map((f) => (
        <button
          key={f.value}
          onClick={() => onChange(f.value)}
          className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
            active === f.value
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
