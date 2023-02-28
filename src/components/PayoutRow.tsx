import dayjs from "dayjs";
import Stripe from "stripe";
import { TableRow } from "~/components/TableRow";
import { TableCell } from "~/components/TableCell";
import { api } from "~/utils/api";
import { StatusPill } from "~/components/StatusPill";
import { Checkbox } from "~/components/Checkbox";

export type PayoutRowProps = {
  payout: Stripe.Payout;
  onSelect?: () => void;
  onDeselect?: () => void;
  selected?: boolean;
};

export function PayoutRow(props: PayoutRowProps) {
  const { data: status } = api.app.getDaybookTransactionStatus.useQuery({
    stripeId: props.payout.id,
  });

  return (
    <TableRow selected={props.selected}>
      <TableCell>
        <Checkbox
          onChange={() =>
            props.selected ? props.onDeselect?.() : props.onSelect?.()
          }
          checked={props.selected}
        />
      </TableCell>
      <TableCell>
        {dayjs(props.payout.created * 1000).format("DD/MM/YYYY HH:mm")}
      </TableCell>
      <TableCell>{(props.payout.amount / 100).toLocaleString()}</TableCell>
      <TableCell>{props.payout.currency.toUpperCase()}</TableCell>
      <TableCell>
        <StatusPill
          status={
            status === "APPROVED"
              ? "success"
              : status === "VOIDED"
              ? "info"
              : "warning"
          }
          text={
            status === "APPROVED"
              ? "synced"
              : status === "VOIDED"
              ? "voided"
              : "not synced"
          }
        />
      </TableCell>
    </TableRow>
  );
}
