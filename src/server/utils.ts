import Stripe from "stripe";
import { env } from "~/env.mjs";
import { Billy, DaybookTransactionInput } from "~/server/billy";

export async function buildDaybookTransactionFromCharge(charge: Stripe.Charge) {
  const stripe = new Stripe(env.STRIPE_API_KEY, { apiVersion: "2022-11-15" });
  const billy = new Billy(env.BILLY_API_KEY);
  const country = charge.billing_details.address?.country;
  const balanceTransaction = await stripe.balanceTransactions.retrieve(
    charge.balance_transaction as string
  );
  const feeAmount = balanceTransaction.fee / 100;
  const balanceTransactionAmount = balanceTransaction.amount / 100;
  const daybookTransaction: DaybookTransactionInput = {
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

  return daybookTransaction;
}

export async function buildDaybookTransactionFromPayout(payout: Stripe.Payout) {
  const billy = new Billy(env.BILLY_API_KEY);
  const daybookTransaction: DaybookTransactionInput = {
    daybookId: (await billy.getDaybook()).id,
    entryDate: new Date(payout.arrival_date * 1000)
      .toISOString()
      .split("T")[0]!,
    state: "draft",
    voucherNo: payout.id,
    lines: [
      {
        text: payout.description || "Payout",
        amount: payout.amount / 100,
        side: "credit",
        currencyId: "DKK",
        accountId: (await billy.getDefaultStripeAccount()).id,
        priority: 0,
      },
      {
        amount: payout.amount / 100,
        side: "debit",
        currencyId: "DKK",
        accountId: (await billy.getDefaultBankAccount()).id,
        priority: 1,
      },
    ],
  };

  return daybookTransaction;
}
