import Stripe from "stripe";
import { NextApiRequest, NextApiResponse } from "next";
import { log } from "next-axiom";
import { env } from "~/env.mjs";
import { buffer } from "micro";
import {
  buildDaybookTransactionFromCharge,
  buildDaybookTransactionFromPayout,
  createDaybookTransactionFromCharge,
  createDaybookTransactionFromPayout,
  voidDaybookTransactionForPayout,
} from "~/server/utils";
import { Billy } from "~/server/billy";
import { prisma } from "~/server/db";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function stripeWebhook(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const sig = req.headers["stripe-signature"];

    if (req.method !== "POST") {
      return res
        .setHeader("Allow", "POST")
        .status(405)
        .end("Method Not Allowed");
    }

    if (typeof sig !== "string") {
      log.debug("Missing Stripe signature");
      return res.status(400).json({ error: "Missing Stripe signature" });
    }

    let event: Stripe.Event;
    const buf = await buffer(req);

    const stripe = new Stripe(env.STRIPE_API_KEY, { apiVersion: "2022-11-15" });

    try {
      event = stripe.webhooks.constructEvent(
        buf,
        sig,
        env.STRIPE_WEBHOOK_SECRET
      );
    } catch (error: any) {
      log.error((error as Error).toString());
      res.status(400).json({ error: error as Error });
      return;
    }

    switch (event.type) {
      case "charge.succeeded":
        await createDaybookTransactionFromCharge(
          event.data.object as Stripe.Charge
        );
        break;
      case "payout.paid":
        await createDaybookTransactionFromPayout(
          event.data.object as Stripe.Payout
        );
        break;
      case "payout.failed":
        await voidDaybookTransactionForPayout(
          event.data.object as Stripe.Payout
        );
        break;
      default:
        log.debug("Unhandled event type", { type: event.type });
        break;
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    log.error((error as Error).toString());
    res.status(500).json({
      error: error as Error,
    });
  }
}
