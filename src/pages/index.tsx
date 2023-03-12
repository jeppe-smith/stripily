import dayjs from "dayjs";
import { ExternalLink } from "~/components/ExternalLink";
import { TableCell } from "~/components/TableCell";
import { TableHeader } from "~/components/TableHeader";
import { TableRow } from "~/components/TableRow";
import { api } from "~/utils/api";

export default function Transactions() {
  const { data: transactions } = api.transactions.list.useQuery();

  if (!transactions) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1 className="mb-4 text-3xl font-bold text-gray-900">Transaktioner</h1>
      <table className="w-full">
        <thead>
          <TableRow header>
            <TableHeader collapse>Oprettet</TableHeader>
            <TableHeader>Type</TableHeader>
            <TableHeader>Stripe ID</TableHeader>
            <TableHeader>Billy ID</TableHeader>
          </TableRow>
        </thead>
        <tbody>
          {transactions?.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>
                {dayjs(transaction.createdAt).format("DD/MM/YYYY HH:mm")}
              </TableCell>
              <TableCell>{transaction.stripeType}</TableCell>
              <TableCell>
                <ExternalLink
                  text={transaction.stripeId}
                  href={`https://dashboard.stripe.com/${transaction.stripeType.toLowerCase()}s/${
                    transaction.stripeId
                  }`}
                />
              </TableCell>
              <TableCell>
                {transaction.billyId && (
                  <ExternalLink
                    text={transaction.billyId}
                    href={`https://mit.billy.dk/odense-web-2/transactions/${transaction.billyId}`}
                  />
                )}
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </table>
    </div>
  );
}
