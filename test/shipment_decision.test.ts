import assert from "node:assert/strict";
import test from "node:test";
import { decideException } from "../src/shipment_decision.ts";

test("a critical latest exception opens an urgent exception case", () => {
  const decision = decideException({
    shipmentId: "SHP-91",
    customerName: "Frame House",
    destination: "Studio B",
    events: [
      {
        type: "in_transit",
        occurredAt: "2026-09-29T08:00:00.000Z",
        location: "Depot",
        note: "Lighting kit departed.",
        severity: "info"
      },
      {
        type: "exception",
        occurredAt: "2026-09-29T09:00:00.000Z",
        location: "Sorting center",
        note: "Protective case was damaged in handling.",
        severity: "critical"
      }
    ],
    proofOfDelivery: []
  });

  assert.deepEqual(decision, {
    action: "open_exception_case",
    reason: "Protective case was damaged in handling.",
    priority: "urgent"
  });
});

test("a delivered shipment without a file requests proof", () => {
  const decision = decideException({
    shipmentId: "SHP-92",
    customerName: "Frame House",
    destination: "Studio B",
    events: [
      {
        type: "delivered",
        occurredAt: "2026-09-29T12:00:00.000Z",
        location: "Studio B",
        note: "Delivery scan recorded.",
        severity: "info"
      }
    ],
    proofOfDelivery: []
  });

  assert.equal(decision.action, "request_proof");
});
