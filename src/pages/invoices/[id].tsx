import Link from "next/link";
import { useRouter } from "next/router";
import { Button } from "~/components/Button";
import { api } from "~/utils/api";

export default function Invoice() {
  const router = useRouter();
  const { id } = router.query;
  const invoice = api.stripe.getInvoice.useQuery(
    { id: id as string },
    { enabled: !!id }
  );
  const charges = api.charges.getByInvoice.useQuery(
    { invoice: id as string },
    { enabled: !!id }
  );
  const syncInvoiceToBilly = api.app.syncInvoiceToBilly.useMutation();

  if (invoice.isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Invoice</h1>
      <div>{invoice.data?.id}</div>
      <Button
        text="Sync to Billy"
        icon="CloudArrowUpIcon"
        onClick={() => syncInvoiceToBilly.mutate({ id: id as string })}
      />
      <ul>
        <li>Indbetalinger</li>
        {charges.data?.map((charge) => (
          <li key={charge.id}>
            <Link href={"/charges/" + charge.id}>{charge.id}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
