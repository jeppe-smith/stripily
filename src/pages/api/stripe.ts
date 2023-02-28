import Stripe from "stripe";
import { NextApiRequest, NextApiResponse } from "next";
import { log } from "next-axiom";
import { env } from "~/env.mjs";
import { buffer } from "micro";
import { buildDaybookTransactionFromCharge } from "~/server/utils";
import { Billy } from "~/server/billy";

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
        await createDaybookTransaction(event.data.object as Stripe.Charge);
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

async function createDaybookTransaction(charge: Stripe.Charge) {
  const billy = new Billy(env.BILLY_API_KEY);
  const daybookTransaction = await buildDaybookTransactionFromCharge(charge);

  await billy.createDaybookTransaction(daybookTransaction);

  log.info("Daybook transaction created");
}
