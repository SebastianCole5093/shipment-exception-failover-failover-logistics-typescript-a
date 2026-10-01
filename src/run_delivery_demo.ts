const response = await fetch("http://localhost:3000/shipment-brief", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    shipmentId: "SHP-2048",
    customerName: "Northline Studio",
    destination: "Shanghai editing suite",
    events: [
      {
        type: "out_for_delivery",
        occurredAt: "2026-09-29T08:30:00.000Z",
        location: "Shanghai depot",
        note: "Courier loaded the camera case.",
        severity: "info"
      },
      {
        type: "exception",
        occurredAt: "2026-09-29T10:15:00.000Z",
        location: "Shanghai",
        note: "Recipient requested a delivery window change.",
        severity: "warning"
      }
    ],
    proofOfDelivery: []
  })
});

console.log(JSON.stringify(await response.json(), null, 2));
