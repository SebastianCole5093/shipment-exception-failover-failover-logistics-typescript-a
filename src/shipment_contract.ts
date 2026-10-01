import { z } from "zod";

export const ShipmentEventSchema = z.object({
  type: z.enum(["picked_up", "in_transit", "out_for_delivery", "delivered", "exception"]),
  occurredAt: z.string().datetime(),
  location: z.string().min(1),
  note: z.string().min(1),
  severity: z.enum(["info", "warning", "critical"]).default("info")
});

export const ProofOfDeliverySchema = z.object({
  kind: z.enum(["signature", "photo", "document"]),
  name: z.string().min(1),
  mediaType: z.string().min(1),
  storageUrl: z.string().url(),
  capturedAt: z.string().datetime()
});

export const ShipmentBriefRequestSchema = z.object({
  shipmentId: z.string().min(1),
  customerName: z.string().min(1),
  destination: z.string().min(1),
  events: z.array(ShipmentEventSchema).min(1),
  proofOfDelivery: z.array(ProofOfDeliverySchema).default([])
});

export type ShipmentBriefRequest = z.infer<typeof ShipmentBriefRequestSchema>;

export type ExceptionDecision = {
  action: "publish_delivery_update" | "request_proof" | "open_exception_case";
  reason: string;
  priority: "normal" | "urgent";
};
