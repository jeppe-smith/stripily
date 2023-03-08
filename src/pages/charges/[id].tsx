import { useRouter } from "next/router";
import { Button } from "~/components/Button";
import { api } from "~/utils/api";

export default function Invoice() {
  const router = useRouter();
  const { id } = router.query;
  const charge = api.charges.retrieve.useQuery(
    { id: id as string },
    { enabled: !!id }
  );
  const syncToBilly = api.charges.sync.useMutation();

  if (charge.isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Invoice</h1>
      <div>{charge.data?.id}</div>
      <Button
        text="Sync to Billy"
        icon="CloudArrowUpIcon"
        onClick={() => syncToBilly.mutate({ id: id as string })}
      />
    </div>
  );
}
