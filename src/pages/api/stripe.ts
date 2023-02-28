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
      return res.status(400).send("Missing Stripe signature");
    }

    let event: Stripe.Event;
    const buf = await buffer(req);

    const stripe = new Stripe(env.STRIPE_API_KEY, { apiVersion: "2022-11-15" });
    const billy = new Billy(env.BILLY_API_KEY);

    try {
      event = stripe.webhooks.constructEvent(
        buf,
        sig,
        env.STRIPE_WEBHOOK_SECRET
      );
    } catch (error: any) {
      res.status(400).send(`Webhook Error: ${(error as Error).toString()}`);
      return;
    }

    switch (event.type) {
      case "charge.succeeded":
        buildDaybookTransactionFromCharge(event.data.object as Stripe.Charge)
          .then((daybookTransaction) =>
            billy.createDaybookTransaction(daybookTransaction)
          )
          .then(() => log.debug("Daybook transaction created"))
          .catch((error) => log.error((error as Error).toString()));

        break;
      default:
        console.log("Unhandled event type", event.type);
        break;
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      error: (error as Error).toString(),
    });
  }
}
