import dayjs from "dayjs";
import type Stripe from "stripe";
import { TableRow } from "~/components/TableRow";
import { TableCell } from "~/components/TableCell";
import { api } from "~/utils/api";
import { StatusPill } from "~/components/StatusPill";
import { Checkbox } from "~/components/Checkbox";

export type ChargeRowProps = {
  charge: Stripe.Charge;
  onSelect?: () => void;
  onDeselect?: () => void;
  selected?: boolean;
};

export function ChargeRow(props: ChargeRowProps) {
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
        {dayjs(props.charge.created * 1000).format("DD/MM/YYYY HH:mm")}
      </TableCell>
      <TableCell>{props.charge.amount / 100}</TableCell>
      <TableCell>{props.charge.currency.toUpperCase()}</TableCell>
      <TableCell>
        <StatusPill
          status={props.charge.metadata.billyId ? "success" : "info"}
          text={props.charge.metadata.billyId ? "synced" : "not synced"}
        />
      </TableCell>
    </TableRow>
  );
}
