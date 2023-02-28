import { useQueryClient } from "@tanstack/react-query";
import { getQueryKey } from "@trpc/react-query";
import { useState } from "react";
import { Button } from "~/components/Button";
import { Checkbox } from "~/components/Checkbox";
import { PayoutRow } from "~/components/PayoutRow";
import { TableHead } from "~/components/TableHeader";
import { TableRow } from "~/components/TableRow";
import { api } from "~/utils/api";

export function PayoutsTable() {
  const queryClient = useQueryClient();
  const payouts = api.stripe.getPayouts.useQuery();
  const syncPayouts = api.app.syncPayouts.useMutation({
    // onSuccess: () => payouts.refetch(),
    async onSuccess() {
      await queryClient.invalidateQueries({
        queryKey: getQueryKey(api.app.getDaybookTransactionStatus),
      });
    },
  });
  const [selected, setSelected] = useState<string[]>([]);
  const isAllSelected = selected.length === payouts.data?.length;

  if (payouts.isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="mt-6 mb-4 flex justify-end">
        <Button
          text="Sync selected"
          icon="CloudArrowUpIcon"
          primary
          onClick={() => syncPayouts.mutate({ ids: selected })}
        />
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
                    : setSelected(payouts.data?.map(({ id }) => id) ?? [])
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
          {payouts.data?.map((payout) => (
            <PayoutRow
              key={payout.id}
              payout={payout}
              selected={selected.includes(payout.id)}
              onSelect={() => setSelected([...selected, payout.id])}
              onDeselect={() =>
                setSelected(selected.filter((id) => id !== payout.id))
              }
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
