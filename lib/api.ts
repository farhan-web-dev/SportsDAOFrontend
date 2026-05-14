const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api/v1";

export type ApiOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: BodyInit;
  walletAddress?: string;
};

export const apiFetch = async <T = unknown>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> => {
  const { method = "GET", headers = {}, body, walletAddress } = options;

  const requestHeaders: HeadersInit = {
    "Content-Type": "application/json",
    ...headers,
  };

  // Add wallet address to headers if provided
  if (walletAddress) {
    requestHeaders["x-wallet-address"] = walletAddress;
  }

  // Remove Content-Type for FormData
  if (body instanceof FormData) {
    delete requestHeaders["Content-Type"];
  }

  const fullUrl = `${API_BASE_URL}${endpoint}`;

  // Log the body content for debugging
  let bodyContent = body;
  if (body instanceof FormData) {
    bodyContent = "[FormData]";
  } else if (typeof body === "string") {
    try {
      bodyContent = JSON.parse(body);
    } catch {
      bodyContent = body;
    }
  }

  console.log("🌐 API Request:", {
    url: fullUrl,
    method,
    headers: requestHeaders,
    body: bodyContent,
    bodyString: typeof body === "string" ? body : undefined,
    bodyType: typeof body,
    bodyLength: typeof body === "string" ? body.length : undefined,
  });

  // Ensure body is properly formatted
  const requestBody = body;

  const response = await fetch(fullUrl, {
    method,
    headers: requestHeaders,
    body: requestBody,
  });

  console.log("📥 API Response:", {
    url: fullUrl,
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const errorData = await response.json();
      message = errorData?.error ?? errorData?.message ?? message;
      console.error("❌ API Error Response:", errorData);
    } catch (_) {
      try {
        const errorText = await response.text();
        message = errorText || message;
        console.error("❌ API Error Text:", errorText);
      } catch {
        // ignore parsing errors and use default message
      }
    }

    throw new Error(message);
  }

  return response.json();
};
