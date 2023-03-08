import dayjs from "dayjs";
import Stripe from "stripe";
import { TableRow } from "~/components/TableRow";
import { TableCell } from "~/components/TableCell";
import { api } from "~/utils/api";
import { StatusPill } from "~/components/StatusPill";
import { Checkbox } from "~/components/Checkbox";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/20/solid";

export type BalanceTransactionRowProps = {
  balanceTransaction: Stripe.BalanceTransaction;
  onSelect?: () => void;
  onDeselect?: () => void;
  selected?: boolean;
};

export function BalanceTransactionRow(props: BalanceTransactionRowProps) {
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
        {dayjs(props.balanceTransaction.created * 1000).format(
          "DD/MM/YYYY HH:mm"
        )}
      </TableCell>
      <TableCell>{props.balanceTransaction.amount / 100}</TableCell>
      <TableCell>{props.balanceTransaction.currency.toUpperCase()}</TableCell>
      <TableCell>
        {props.balanceTransaction.reporting_category}
        {/* <StatusPill
          status={props.balanceTransaction.metadata.billyId ? "success" : "info"}
          text={props.balanceTransaction.metadata.billyId ? "synced" : "not synced"}
        /> */}
      </TableCell>
      <TableCell>
        <StatusPill
          status={
            props.balanceTransaction.status === "available" ? "success" : "info"
          }
          text={props.balanceTransaction.status}
        />
      </TableCell>
      <TableCell>
        <a
          href={`https://dashboard.stripe.com/transactions/${props.balanceTransaction.id}`}
          target="_blank"
        >
          {props.balanceTransaction.id}
        </a>
      </TableCell>
    </TableRow>
  );
}
