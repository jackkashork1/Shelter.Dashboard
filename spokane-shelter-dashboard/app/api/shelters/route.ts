import { NextRequest, NextResponse } from "next/server";
import { shelters, ShelterEntry } from "@/lib/shelters";

type FilterParam =
  | "all"
  | "low-barrier"
  | "high-barrier"
  | "inclement-only"
  | "families"
  | "women"
  | "men"
  | "youth"
  | "lgbtq"
  | "dv";

function applyFilter(list: ShelterEntry[], filter: FilterParam): ShelterEntry[] {
  switch (filter) {
    case "all":
      return list;
    case "low-barrier":
      return list.filter((s) => s.barrierLevel === "low");
    case "high-barrier":
      return list.filter((s) => s.barrierLevel === "high");
    case "inclement-only":
      return list.filter((s) => s.barrierLevel === "inclement-only");
    case "families":
      return list.filter((s) => s.populationServed.includes("Families"));
    case "women":
      return list.filter((s) => s.populationServed.includes("Adult women"));
    case "men":
      return list.filter((s) => s.populationServed.includes("Adult men"));
    case "youth":
      return list.filter((s) => s.populationServed.includes("Youth"));
    case "lgbtq":
      return list.filter((s) => s.populationServed.includes("LGBTQIA+"));
    case "dv":
      return list.filter((s) => s.populationServed.includes("Domestic violence"));
    default:
      return list;
  }
}

const VALID_FILTERS = new Set<FilterParam>([
  "all",
  "low-barrier",
  "high-barrier",
  "inclement-only",
  "families",
  "women",
  "men",
  "youth",
  "lgbtq",
  "dv",
]);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawFilter = searchParams.get("filter") ?? "all";
  const filter: FilterParam = VALID_FILTERS.has(rawFilter as FilterParam)
    ? (rawFilter as FilterParam)
    : "all";

  const result = applyFilter(shelters, filter);
  return NextResponse.json({ filter, count: result.length, shelters: result });
}
