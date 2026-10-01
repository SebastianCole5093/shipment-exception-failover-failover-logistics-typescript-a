import { createServer, type ServerResponse } from "node:http";
import OpenAI from "openai";
import { ZodError } from "zod";
import { ShipmentBriefRequestSchema, type ShipmentBriefRequest } from "./shipment_contract.ts";
import { decideException } from "./shipment_decision.ts";
import {
  INFRAI_BASE_URL,
  InfraiRequestError,
  setChatRoutingPreference
} from "./routing_preference.ts";

const apiKey = process.env.INFRAI_API_KEY;
if (!apiKey) throw new Error("Set INFRAI_API_KEY before starting the service.");

const ai = new OpenAI({ apiKey, baseURL: INFRAI_BASE_URL });

function reply(response: ServerResponse, status: number, payload: unknown): void {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(payload));
}

async function readJson(request: AsyncIterable<Buffer>): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function writeCustomerBrief(input: ShipmentBriefRequest): Promise<string> {
  const decision = decideException(input);
  const completion = await ai.chat.completions.create({
    model: "auto",
    messages: [
      {
        role: "system",
        content: "Write a factual two-sentence shipment update. Do not invent delivery facts or file contents."
      },
      {
        role: "user",
        content: JSON.stringify({
          shipmentId: input.shipmentId,
          customerName: input.customerName,
          destination: input.destination,
          events: input.events,
          proofOfDelivery: input.proofOfDelivery,
          decision
        })
      }
    ]
  });
  return completion.choices[0]?.message.content ?? "Shipment update prepared.";
}

const server = createServer(async (request, response) => {
  if (request.method !== "POST" || request.url !== "/shipment-brief") {
    reply(response, 404, { error: "Route not found" });
    return;
  }

  try {
    const input = ShipmentBriefRequestSchema.parse(await readJson(request));
    const decision = decideException(input);
    const customerBrief = await writeCustomerBrief(input);
    reply(response, 200, { shipmentId: input.shipmentId, decision, customerBrief });
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      reply(response, 400, { error: "Invalid shipment brief request" });
      return;
    }
    if (error instanceof InfraiRequestError) {
      reply(response, error.status >= 400 && error.status < 500 ? error.status : 502, {
        error: error.message,
        code: error.code
      });
      return;
    }
    if (error instanceof OpenAI.APIError) {
      const status = error.status && error.status < 500 ? error.status : 502;
      reply(response, status, { error: error.message });
      return;
    }
    reply(response, 500, { error: "Could not prepare the shipment brief" });
  }
});

const port = Number(process.env.PORT ?? 3000);

const excludedVendor = process.env.INFRAI_EXCLUDED_VENDOR;
if (excludedVendor) await setChatRoutingPreference(apiKey, excludedVendor);
server.listen(port, () => {
  console.log(`Shipment brief service listening on http://localhost:${port}`);
});
