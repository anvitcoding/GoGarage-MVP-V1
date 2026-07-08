export default function VehicleCard({ vehicle }) {
  return (
    <div className="bg-white rounded-lg shadow p-4 border">
      <h3 className="font-semibold text-lg">
        {vehicle.make} {vehicle.model}
      </h3>
      <p className="text-sm text-gray-500 mt-1">
        Reg: <span className="font-mono text-gray-700">{vehicle.reg_number}</span>
      </p>
      <div className="flex gap-4 mt-2 text-xs text-gray-400">
        {vehicle.year && <span>Year: {vehicle.year}</span>}
        {vehicle.fuel_type && <span className="capitalize">Fuel: {vehicle.fuel_type}</span>}
      </div>
    </div>
  );
}
