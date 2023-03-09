import Stripe from "stripe";
import { type NextApiRequest, type NextApiResponse } from "next";
import { log } from "next-axiom";
import { env } from "~/env.mjs";
import { buffer } from "micro";
import { Billy } from "~/utils/billy";

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
    const billy = new Billy(env.BILLY_API_KEY);

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
      case "invoice.finalized":
        await billy.syncInvoice((event.data.object as Stripe.Invoice).id);
      case "invoice.paid":
        await billy.syncInvoicePayment(event.data.object as Stripe.Invoice);
        break;
      case "payout.paid":
        billy.handlePayoutPaid(event.data.object as Stripe.Payout);
        break;
      case "payout.failed":
        billy.handlePayoutFailed(event.data.object as Stripe.Payout);
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
