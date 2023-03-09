import "dotenv/config";
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";

async function seed() {
  const prisma = new PrismaClient();
  const stripe = new Stripe(process.env.STRIPE_API_KEY!, {
    apiVersion: "2022-11-15",
  });
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
          stripeId: invoice.charge as string,
          stripeType: "CHARGE",
          billyId: "billy-" + invoice.charge,
        },
      });
    })
  );
}

seed();
