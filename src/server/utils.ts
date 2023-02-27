import Stripe from "stripe";
import { env } from "~/env.mjs";
import { Billy, DaybookTransactionInput } from "~/server/billy";

export async function buildDaybookTransactionFromCharge(
  charge: Stripe.Charge
): Promise<DaybookTransactionInput> {
  const stripe = new Stripe(env.STRIPE_API_KEY, { apiVersion: "2022-11-15" });
  const billy = new Billy(env.BILLY_API_KEY);
  const country = charge.billing_details.address?.country;
  const balanceTransaction = await stripe.balanceTransactions.retrieve(
    charge.balance_transaction as string
  );
  const exchangeRate = balanceTransaction.exchange_rate!;
  // const chargeAmount = Math.round(charge.amount * exchangeRate) / 100;
  const feeAmount = balanceTransaction.fee / 100;
  const balanceTransactionAmount = balanceTransaction.amount / 100;

  return {
    daybookId: (await billy.getDaybook()).id,
    entryDate: new Date(charge.created * 1000).toISOString().split("T")[0]!,
    state: "draft",
    voucherNo: charge.invoice as string,
    lines: [
      {
        text: charge.description!,
        amount: balanceTransactionAmount,
        side: "debit",
        currencyId: "DKK",
        accountId: (await billy.getSalesAccount(country)).id,
        taxRateId: (await billy.getTaxRate(country)).id,
        priority: 0,
      },
      {
        amount: feeAmount,
        side: "credit",
        currencyId: "DKK",
        accountId: (await billy.getDefaultFeesAccount()).id,
        priority: 1,
      },
      {
        amount: balanceTransactionAmount - feeAmount,
        side: "credit",
        currencyId: "DKK",
        accountId: (await billy.getDefaultStripeAccount()).id,
        priority: 2,
      },
    ],
  };
}
