import { useQueryClient } from "@tanstack/react-query";
import { getQueryKey } from "@trpc/react-query";
import { useState } from "react";
import { BalanceTransactionRow } from "~/components/BalanceTransactionRow";
import { Button } from "~/components/Button";
import { ChargeRow } from "~/components/ChargeRow";
import { Checkbox } from "~/components/Checkbox";
import { TableHeader } from "~/components/TableHeader";
import { TableRow } from "~/components/TableRow";
import { api } from "~/utils/api";

export function BalanceTransactionsTable() {
  const balanceTransactions = api.stripe.getBalanceTransactions.useQuery();
  const [selected, setSelected] = useState<string[]>([]);
  const isAllSelected = selected.length === balanceTransactions.data?.length;

  if (balanceTransactions.isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="mt-6 mb-4 flex justify-end">
        {/* <Button
          text="Sync selected"
          icon="CloudArrowUpIcon"
          primary
          onClick={() => syncCharges.mutate({ ids: selected })}
        /> */}
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
                        balanceTransactions.data?.map(({ id }) => id) ?? []
                      )
                }
              />
            </TableHeader>
            <TableHeader>Date</TableHeader>
            <TableHeader>Amount</TableHeader>
            <TableHeader>Currency</TableHeader>
            <TableHeader>Type</TableHeader>
            <TableHeader>Status</TableHeader>
            <TableHeader collapse />
          </TableRow>
        </thead>
        <tbody>
          {balanceTransactions.data?.map((balanceTransaction) => (
            <BalanceTransactionRow
              key={balanceTransaction.id}
              balanceTransaction={balanceTransaction}
              selected={selected.includes(balanceTransaction.id)}
              onSelect={() => setSelected([...selected, balanceTransaction.id])}
              onDeselect={() =>
                setSelected(
                  selected.filter((id) => id !== balanceTransaction.id)
                )
              }
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
