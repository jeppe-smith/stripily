import Stripe from "stripe";
import { NextApiRequest, NextApiResponse } from "next";
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
    } catch (error) {
      res.status(400).send(`Webhook Error: ${error}`);
      return;
    }

    switch (event.type) {
      case "charge.succeeded":
        buildDaybookTransactionFromCharge(event.data.object as Stripe.Charge)
          .then((daybookTransaction) =>
            billy.createDaybookTransaction(daybookTransaction)
          )
          .then(() => console.log("Daybook transaction created"))
          .catch(console.error);

        break;
      default:
        console.log("Unhandled event type", event.type);
        break;
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      error: error.toString(),
    });
  }
}
