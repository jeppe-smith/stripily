import { log } from "next-axiom";
import Stripe from "stripe";
import { env } from "~/env.mjs";
import {
  Billy,
  DaybookTransactionInput,
  DaybookTransactionLine,
  DaybookTransactionLineInput,
} from "~/utils/billy";
import { prisma } from "~/server/db";

// type TaxAmount = {
//   amount: number;
//   inclusive: boolean;
//   tax_rate:
// }

export async function buildDaybookTransactionFromCharge(charge: Stripe.Charge) {
  const stripe = new Stripe(env.STRIPE_API_KEY, { apiVersion: "2022-11-15" });
  const billy = new Billy(env.BILLY_API_KEY);
  const country = charge.billing_details.address?.country;
  const balanceTransaction = await stripe.balanceTransactions.retrieve(
    charge.balance_transaction as string
  );
  const invoice = await stripe.invoices.retrieve(charge.invoice as string, {
    expand: ["total_tax_amounts.tax_rate"],
  });
  const exchangeRate = balanceTransaction.exchange_rate ?? 1;
  const taxLines = await getTaxLines(invoice, exchangeRate);
  const feeAmount = balanceTransaction.fee;
  const taxAmount = Math.round((invoice.tax ?? 0) * exchangeRate);
  const purchaseAmount = Math.round(
    (invoice.total_excluding_tax ?? 0) * exchangeRate
  );
  const daybookTransaction: DaybookTransactionInput = {
    daybookId: (await billy.getDaybook()).id,
    entryDate: new Date(charge.created * 1000).toISOString().split("T")[0]!,
    state: "draft",
    voucherNo: charge.invoice as string,
    lines: [
      {
        amount: purchaseAmount / 100,
        text: charge.description!,
        side: "credit",
        currencyId: "DKK",
        accountId: (await billy.getSalesAccount(country)).id,
        priority: 0,
      },
      ...taxLines,
      {
        amount: feeAmount / 100,
        side: "debit",
        currencyId: "DKK",
        accountId: (await billy.getDefaultFeesAccount()).id,
        priority: 1,
      },
      {
        amount: (purchaseAmount - feeAmount + taxAmount) / 100,
        side: "debit",
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

export async function createDaybookTransactionFromCharge(
  charge: Stripe.Charge
) {
  const stripe = new Stripe(env.STRIPE_API_KEY, { apiVersion: "2022-11-15" });
  const billy = new Billy(env.BILLY_API_KEY);
  const input = await buildDaybookTransactionFromCharge(charge);
  const { daybookTransactions } = await billy.createDaybookTransaction(input);
  const daybookTransaction = daybookTransactions[0]!;
  const { state } = daybookTransaction;

  await stripe.charges.update(charge.id, {
    metadata: {
      billyId: daybookTransaction.id,
    },
  });

  // await prisma.daybookTransaction.create({
  //   data: {
  //     billyId: daybookTransaction.id,
  //     stripeId: charge.id,
  //     object: "CHARGE",
  //     state: state === "voided" ? "VOIDED" : "APPROVED",
  //   },
  // });

  log.info("Daybook transaction created");
}

export async function createDaybookTransactionFromPayout(
  payout: Stripe.Payout
) {
  const billy = new Billy(env.BILLY_API_KEY);
  const input = await buildDaybookTransactionFromPayout(payout);
  const { daybookTransactions } = await billy.createDaybookTransaction(input);
  const daybookTransaction = daybookTransactions[0]!;
  const { state } = daybookTransaction;

  await prisma.daybookTransaction.create({
    data: {
      billyId: daybookTransaction.id,
      stripeId: payout.id,
      object: "PAYOUT",
      state: state === "voided" ? "VOIDED" : "APPROVED",
    },
  });

  await billy.createDaybookTransaction(input);

  log.info("Daybook transaction created");
}

async function getTaxLines(invoice: Stripe.Invoice, exchangeRate: number) {
  const billy = new Billy(env.BILLY_API_KEY);
  const taxLines: DaybookTransactionLineInput[] = [];

  for (const taxAmount of invoice.total_tax_amounts) {
    const taxRate = taxAmount.tax_rate as Stripe.TaxRate;

    if (taxRate.country === "DK" && taxRate.percentage === 25) {
      taxLines.push({
        amount: Math.round(taxAmount.amount * exchangeRate) / 100,
        side: "credit",
        currencyId: "DKK",
        accountId: (await billy.getDkVatAccount()).id,
        priority: 0,
      });
    }
  }

  return taxLines;
}
