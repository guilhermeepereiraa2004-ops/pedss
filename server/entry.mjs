import { waitUntil } from "@vercel/functions";
import { createHandler } from "./api.mjs";

export default createHandler({ defer: waitUntil });
