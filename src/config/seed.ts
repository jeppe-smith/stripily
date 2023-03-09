import "dotenv/config";
import Stripe from "stripe";
import { prisma } from "~/server/db";

// @ts-ignore
const stripe = new Stripe(process.env.STRIPE_API_KEY, {
  apiVersion: "2022-11-15",
});

async function seed() {
  const invoices = await stripe.invoices.list({ limit: 5, status: "paid" });

  await Promise.all(
    invoices.data.map(async (invoice) => {
      await prisma.transaction.create({
        data: {
          status: "SUCCESS",
          stripeId: invoice.id,
          stripeType: "INVOICE",
          billyId: "billy-" + invoice.id,
        },
      });

      await prisma.transaction.create({
        data: {
          status: "SUCCESS",
          // @ts-ignore
          stripeId: invoice.charge,
          stripeType: "CHARGE",
          billyId: "billy-" + invoice.charge,
        },
      });
    })
  );
}

seed();
