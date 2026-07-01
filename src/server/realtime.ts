import "server-only";

import Pusher from "pusher";

import { env } from "~/env";

const pusher = new Pusher({
  appId: env.PUSHER_APP_ID,
  key: env.NEXT_PUBLIC_PUSHER_KEY,
  secret: env.PUSHER_SECRET,
  cluster: env.NEXT_PUBLIC_PUSHER_CLUSTER,
  useTLS: true,
});

export async function publishStudentsChanged() {
  try {
    await pusher.trigger("students", "changed", { at: Date.now() });
  } catch (error) {
    console.error("Failed to publish students changed event", error);
  }
}
