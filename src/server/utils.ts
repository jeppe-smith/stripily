import { log } from "next-axiom";
import Stripe from "stripe";
import { env } from "~/env.mjs";
import { Billy, DaybookTransactionInput } from "~/server/billy";
import { prisma } from "~/server/db";

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
        side: "debit",
        currencyId: "DKK",
        accountId: (await billy.getDefaultStripeAccount()).id,
        priority: 0,
      },
      {
        amount: payout.amount / 100,
        side: "credit",
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
  const billy = new Billy(env.BILLY_API_KEY);
  const input = await buildDaybookTransactionFromCharge(charge);
  const { daybookTransactions } = await billy.createDaybookTransaction(input);
  const daybookTransaction = daybookTransactions[0]!;
  const { state } = daybookTransaction;

  await prisma.daybookTransaction.create({
    data: {
      billyId: daybookTransaction.id,
      stripeId: charge.id,
      object: "CHARGE",
      state: state === "voided" ? "VOIDED" : "APPROVED",
    },
  });

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

export async function voidDaybookTransactionForPayout(payout: Stripe.Payout) {
  const billy = new Billy(env.BILLY_API_KEY);
  const daybookTransaction = await billy.getDaybookTransactionForPayout(
    payout.id
  );

  if (daybookTransaction) {
    await billy.voidDaybookTransaction(daybookTransaction.id);
    await prisma.daybookTransaction.update({
      where: {
        billyId: daybookTransaction.id,
        stripeId: payout.id,
      },
      data: {
        state: "VOIDED",
      },
    });

    log.info("Daybook transaction voided");
  } else {
    log.info("Daybook transaction not found: " + payout.id);
  }
}
