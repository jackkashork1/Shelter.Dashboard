import type { ShelterEntry } from "@/lib/shelters";

const STATUS_STYLES: Record<ShelterEntry["status"], string> = {
  open: "bg-green-100 text-green-800",
  full: "bg-red-100 text-red-800",
  closed: "bg-gray-200 text-gray-600",
  unknown: "bg-yellow-100 text-yellow-800",
  "inclement-only": "bg-blue-100 text-blue-800",
};

const STATUS_LABEL: Record<ShelterEntry["status"], string> = {
  open: "Open",
  full: "Full",
  closed: "Closed",
  unknown: "Status Unknown",
  "inclement-only": "Inclement Only",
};

const BARRIER_LABEL: Record<ShelterEntry["barrierLevel"], string> = {
  low: "Low Barrier",
  high: "High Barrier",
  transitional: "Transitional",
  "inclement-only": "Inclement Only",
};

export default function ShelterCard({ shelter }: { shelter: ShelterEntry }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <h2 className="font-semibold text-gray-900 leading-tight">{shelter.name}</h2>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[shelter.status]}`}
        >
          {STATUS_LABEL[shelter.status]}
        </span>
      </div>

      <p className="text-xs text-gray-500">{shelter.operator}</p>

      <div className="flex flex-wrap gap-1">
        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
          {BARRIER_LABEL[shelter.barrierLevel]}
        </span>
        {shelter.populationServed.map((p) => (
          <span key={p} className="rounded bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700">
            {p}
          </span>
        ))}
      </div>

      <div className="text-sm text-gray-700 space-y-0.5">
        <p>
          <span className="font-medium">Address:</span> {shelter.address}
        </p>
        {shelter.phone && (
          <p>
            <span className="font-medium">Phone:</span>{" "}
            <a href={`tel:${shelter.phone}`} className="text-indigo-600 hover:underline">
              {shelter.phone}
            </a>
          </p>
        )}
        {shelter.email && (
          <p>
            <span className="font-medium">Email:</span>{" "}
            <a href={`mailto:${shelter.email}`} className="text-indigo-600 hover:underline">
              {shelter.email}
            </a>
          </p>
        )}
      </div>

      <div className="text-sm text-gray-700 flex gap-4">
        <span>
          <span className="font-medium">Total beds:</span>{" "}
          {shelter.totalBeds !== null ? shelter.totalBeds : "—"}
        </span>
        <span>
          <span className="font-medium">Available:</span>{" "}
          {shelter.bedsAvailable !== null ? shelter.bedsAvailable : "—"}
        </span>
      </div>

      {shelter.notes && <p className="text-xs text-gray-500 italic">{shelter.notes}</p>}

      <p className="text-xs text-gray-400 mt-auto">
        Updated: {new Date(shelter.lastUpdated).toLocaleString()}
      </p>
    </div>
  );
}
