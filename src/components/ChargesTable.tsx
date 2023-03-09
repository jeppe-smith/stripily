import { useQueryClient } from "@tanstack/react-query";
import { getQueryKey } from "@trpc/react-query";
import { useState } from "react";
import { Button } from "~/components/Button";
import { ChargeRow } from "~/components/ChargeRow";
import { Checkbox } from "~/components/Checkbox";
import { TableHeader } from "~/components/TableHeader";
import { TableRow } from "~/components/TableRow";
import { api } from "~/utils/api";

export function ChargesTable() {
  const pendingCharges = api.stripe.getPendingCharges.useQuery();
  const [selected, setSelected] = useState<string[]>([]);
  const isAllSelected = selected.length === pendingCharges.data?.length;

  if (pendingCharges.isLoading) {
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
            <TableHeader collapse>
              <Checkbox
                checked={isAllSelected}
                onChange={() =>
                  isAllSelected
                    ? setSelected([])
                    : setSelected(
                        pendingCharges.data?.map(({ id }) => id) ?? []
                      )
                }
              />
            </TableHeader>
            <TableHeader>Date</TableHeader>
            <TableHeader>Amount</TableHeader>
            <TableHeader>Currency</TableHeader>
            <TableHeader>Status</TableHeader>
          </TableRow>
        </thead>
        <tbody>
          {pendingCharges.data?.map((charge) => (
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
