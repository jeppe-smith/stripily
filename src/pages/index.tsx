import { CheckCircleIcon } from "@heroicons/react/20/solid";
import { Transaction } from "@prisma/client";
import dayjs from "dayjs";
import Link from "next/link";
import { useState } from "react";
import Stripe from "stripe";
import { Badge } from "~/components/Badge";
import { Checkbox } from "~/components/Checkbox";
import { Header } from "~/components/Header";
import { StatusPill, StatusPillProps } from "~/components/StatusPill";
import { TableCell } from "~/components/TableCell";
import { TableHeader } from "~/components/TableHeader";
import { TableRow } from "~/components/TableRow";
import { api } from "~/utils/api";

export default function AccountingEvents() {
  const { data: events } = api.events.list.useQuery();
  const { data: transactions } = api.transactions.findMany.useQuery(
    {
      stripeIds: events?.data.map(({ invoice }) => invoice.id) ?? [],
    },
    { enabled: !!events }
  );
  const transactionsMap = transactions?.reduce(
    (map, transaction) => map.set(transaction.stripeId, transaction),
    new Map<string, Transaction>()
  );
  const [selected, setSelected] = useState<string[]>([]);
  const isAllSelected = selected.length === events?.data.length;

  function getTransactionStatus(stripeId: string): StatusPillProps["status"] {
    const transaction = transactionsMap?.get(stripeId);

    if (transaction?.status === "SUCCESS") {
      return "success";
    }

    if (transaction?.status === "FAILED") {
      return "error";
    }

    return "info";
  }

  function getTransactionStatusText(stripeId: string): string {
    const transaction = transactionsMap?.get(stripeId);

    if (transaction?.status === "SUCCESS") {
      return "OK";
    }

    if (transaction?.status === "FAILED") {
      return "Fejl";
    }

    return "Afventer";
  }

  return (
    <div>
      <h1 className="mb-4 text-3xl font-bold text-gray-900">Hændelser</h1>
      <table className="w-full border-collapse">
        <thead>
          <TableRow>
            <TableHeader collapse>
              <Checkbox
                checked={isAllSelected}
                onChange={() =>
                  isAllSelected
                    ? setSelected([])
                    : setSelected(
                        events?.data.map(({ invoice }) => invoice.id) ?? []
                      )
                }
              />
            </TableHeader>
            <TableHeader collapse>Dato</TableHeader>
            <TableHeader numeric collapse>
              Total
            </TableHeader>
            <TableHeader collapse />
            <TableHeader>Stripe ID</TableHeader>
            <TableHeader>Type</TableHeader>
            <TableHeader>Transaktion</TableHeader>
            <TableHeader collapse />
          </TableRow>
        </thead>
        <tbody>
          {events?.data.map(({ id, invoice, type }) => (
            <TableRow key={id} href={"/invoices/" + invoice.id}>
              <TableCell>
                <Checkbox
                  checked={selected.includes(invoice.id)}
                  onChange={() =>
                    selected.includes(invoice.id)
                      ? setSelected(selected.filter((id) => id !== invoice.id))
                      : setSelected([...selected, invoice.id])
                  }
                />
              </TableCell>
              <TableCell>
                {dayjs(invoice.created * 1000).format("DD/MM/YYYY")}
              </TableCell>
              <TableCell numeric>
                {(invoice.total / 100).toLocaleString("da-DK", {
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 2,
                })}
              </TableCell>
              <TableCell>
                <span className="text-gray-400">
                  {invoice.currency.toUpperCase()}
                </span>
              </TableCell>
              <TableCell>{invoice.id}</TableCell>
              <TableCell>
                <Badge
                  color={type === "invoice.finalized" ? "violet" : "emerald"}
                  text={type === "invoice.finalized" ? "Oprettet" : "Betalt"}
                />
              </TableCell>
              <TableCell>{transactionsMap?.get(invoice.id)?.billyId}</TableCell>
              <TableCell>
                <StatusPill
                  status={getTransactionStatus(invoice.id)}
                  text={getTransactionStatusText(invoice.id)}
                />
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </table>
    </div>
  );
}
