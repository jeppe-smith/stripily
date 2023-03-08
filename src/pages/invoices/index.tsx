import { CheckCircleIcon } from "@heroicons/react/20/solid";
import dayjs from "dayjs";
import Link from "next/link";
import { useState } from "react";
import { Checkbox } from "~/components/Checkbox";
import { Header } from "~/components/Header";
import { StatusPill } from "~/components/StatusPill";
import { TableCell } from "~/components/TableCell";
import { TableHeader } from "~/components/TableHeader";
import { TableRow } from "~/components/TableRow";
import { api } from "~/utils/api";

export default function Invoices() {
  const { data: invoices } = api.invoices.list.useQuery();
  const { data: connections } = api.transactions.findMany.useQuery(
    {
      stripeIds: invoices?.data.map(({ id }) => id) ?? [],
    },
    { enabled: !!invoices }
  );
  const [selected, setSelected] = useState<string[]>([]);
  const isAllSelected = selected.length === invoices?.data.length;

  function getConnection(invoiceId: string) {
    return connections?.find((connection) => connection.stripeId === invoiceId);
  }

  return (
    <div>
      <h1 className="mb-4 text-3xl font-bold text-gray-900">Fakturer</h1>
      <table className="w-full border-collapse">
        <thead>
          <TableRow>
            <TableHeader>
              <Checkbox
                checked={isAllSelected}
                onChange={() =>
                  isAllSelected
                    ? setSelected([])
                    : setSelected(invoices?.data.map(({ id }) => id) ?? [])
                }
              />
            </TableHeader>
            <TableHeader>Oprettet</TableHeader>
            <TableHeader numeric>Total</TableHeader>
            <TableHeader />
            <TableHeader grow>Fakturanummer</TableHeader>
            <TableHeader />
          </TableRow>
        </thead>
        <tbody>
          {invoices?.data.map((invoice) => (
            <TableRow key={invoice.id}>
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
              <TableCell numeric>{invoice.total / 100}</TableCell>
              <TableCell>
                <span className="text-gray-400">
                  {invoice.currency.toUpperCase()}
                </span>
              </TableCell>
              <TableCell>
                <Link href={"/invoices/" + invoice.id}>{invoice.number}</Link>
              </TableCell>
              <TableCell>
                {/* <StatusPill status="success" text="Synced" /> */}
                {getConnection(invoice.id)?.status === "SUCCESS" && (
                  <CheckCircleIcon className="block h-5 w-5 text-green-500" />
                )}
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </table>
    </div>
  );
}
