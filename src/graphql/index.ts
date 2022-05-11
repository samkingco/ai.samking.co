import { createClient } from "urql";

export const client = createClient({
  url: process.env.NEXT_PUBLIC_CMS_ENDPOINT || "",
  requestPolicy: "cache-and-network",
});
