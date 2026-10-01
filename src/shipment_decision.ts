import type { ExceptionDecision, ShipmentBriefRequest } from "./shipment_contract.ts";

export function decideException(input: ShipmentBriefRequest): ExceptionDecision {
  const ordered = [...input.events].sort(
    (left, right) => Date.parse(right.occurredAt) - Date.parse(left.occurredAt)
  );
  const latest = ordered[0];

  if (latest.type === "exception") {
    return {
      action: "open_exception_case",
      reason: latest.note,
      priority: latest.severity === "critical" ? "urgent" : "normal"
    };
  }

  if (latest.type === "delivered" && input.proofOfDelivery.length === 0) {
    return {
      action: "request_proof",
      reason: "The delivery scan has no proof-of-delivery file.",
      priority: "normal"
    };
  }

  return {
    action: "publish_delivery_update",
    reason: `Latest shipment event: ${latest.type}.`,
    priority: "normal"
  };
}
