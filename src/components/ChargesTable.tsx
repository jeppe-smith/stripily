import { useState } from "react";
import { Button } from "~/components/Button";
import { ChargeRow } from "~/components/ChargeRow";
import { Checkbox } from "~/components/Checkbox";
import { TableHead } from "~/components/TableHeader";
import { TableRow } from "~/components/TableRow";
import { api } from "~/utils/api";

export function ChargesTable() {
  const charges = api.stripe.getCharges.useQuery();
  const [selected, setSelected] = useState<string[]>([]);
  const isAllSelected = selected.length === charges.data?.length;

  if (charges.isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="mt-6 mb-4 flex justify-end">
        <Button text="Sync selected" icon="CloudArrowUpIcon" primary />
      </div>
      <table className="w-full">
        <thead>
          <TableRow>
            <TableHead collapse>
              <Checkbox
                checked={isAllSelected}
                onChange={() =>
                  isAllSelected
                    ? setSelected([])
                    : setSelected(charges.data?.map(({ id }) => id) ?? [])
                }
              />
            </TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Currency</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </thead>
        <tbody>
          {charges.data?.map((charge) => (
            <ChargeRow
              key={charge.id}
              charge={charge}
              selected={selected.includes(charge.id)}
              onSelect={() => setSelected([...selected, charge.id])}
              onDeselect={() =>
                setSelected(selected.filter((id) => id !== charge.id))
              }
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
