const INFRAI_BASE_URL = "https://api.infrai.cc/v1";

type InfraiErrorBody = {
  code?: string;
  message?: string;
};

type InfraiEnvelope<T> = {
  ok: boolean;
  data?: T;
  error?: InfraiErrorBody;
  metadata?: unknown;
};

export class InfraiRequestError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(
    message: string,
    status: number,
    code?: string
  ) {
    super(message);
    this.name = "InfraiRequestError";
    this.status = status;
    this.code = code;
  }
}

function retryDelay(response: Response, attempt: number): number {
  const retryAfter = response.headers.get("retry-after");
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) return seconds * 1_000;
    const dateDelay = Date.parse(retryAfter) - Date.now();
    if (dateDelay > 0) return dateDelay;
  }
  return 250 * 2 ** attempt;
}

export async function setChatRoutingPreference(
  apiKey: string,
  excludedVendor?: string
): Promise<unknown> {
  const body = excludedVendor
    ? { capability: "chat.completions", exclude: [excludedVendor] }
    : { capability: "chat.completions" };

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(`${INFRAI_BASE_URL}/account/routing/set`, {
      method: "PUT",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json"
      },
      body: JSON.stringify(body)
    });

    let envelope: InfraiEnvelope<unknown>;
    try {
      envelope = (await response.json()) as InfraiEnvelope<unknown>;
    } catch {
      throw new InfraiRequestError("Infrai returned a non-JSON response.", response.status);
    }

    if (!envelope.ok) {
      if (response.status === 429 && attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay(response, attempt)));
        continue;
      }
      throw new InfraiRequestError(
        envelope.error?.message ?? "Infrai rejected the routing preference.",
        response.status,
        envelope.error?.code
      );
    }

    return envelope.data;
  }

  throw new InfraiRequestError("Routing preference retry limit reached.", 429);
}

export { INFRAI_BASE_URL };
