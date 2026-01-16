/**
 * Server-side API utility for forwarding requests to backend
 * Extracts App Bridge session token from request headers and forwards it
 * Follows Shopify App Bridge session token pattern
 */

const BACKEND_API_URL = process.env.BACKEND_API_URL || "https://agaricaceous-breana-floggingly.ngrok-free.dev";
const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY || "";
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET || "";

/**
 * Extract session token from request headers
 * App Bridge adds the token in the "authorization" header
 * 
 * @param request - Incoming request object
 * @returns Session token or null
 */
export function getSessionTokenFromRequest(request: Request): string | null {
  // App Bridge automatically adds the authorization header
  // Format: "authorization: Bearer <session_token>"
  const authHeader = request.headers.get("authorization");
  
  if (!authHeader) {
    return null;
  }

  // Extract token from "Bearer <token>" format
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

/**
 * Forward request to backend with session token
 * Extracts session token from incoming request and forwards it to backend
 * 
 * @param request - Incoming request
 * @param endpoint - Backend endpoint path
 * @param options - Additional fetch options
 * @returns Promise<Response>
 */
export async function forwardToBackend(
  request: Request,
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${BACKEND_API_URL}${endpoint}`;
  
  // Extract session token from request headers
  const sessionToken = getSessionTokenFromRequest(request);
  
  // Prepare headers for backend request
  const headers = new Headers(options.headers);
  
  // Forward session token to backend
  if (sessionToken) {
    headers.set("authorization", `Bearer ${sessionToken}`);
  }
  
  // Forward other important headers
  const shop = request.headers.get("x-shopify-shop-domain");
  if (shop) {
    headers.set("x-shopify-shop-domain", shop);
  }
  
  const hmac = request.headers.get("x-shopify-hmac-sha256");
  if (hmac) {
    headers.set("x-shopify-hmac-sha256", hmac);
  }
  
  // Set content type if body exists
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // Forward request to backend
  try {
    console.log("🌐 Fetching backend URL:", url);
    console.log("📤 Request method:", options.method || request.method);
    console.log("📋 Request headers:", Object.fromEntries(headers.entries()));
    
    const response = await fetch(url, {
      ...options,
      method: options.method || request.method,
      headers,
      body: options.body || (request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined),
    });
    
    console.log("📥 Backend response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error("❌ Backend error:", errorText.substring(0, 500));
    }
    
    return response;
  } catch (error) {
    console.error("❌ Fetch error:", error);
    throw error;
  }
}

/**
 * Forward GET request to backend
 */
export async function forwardGet<T = unknown>(
  request: Request,
  endpoint: string
): Promise<T> {
  const response = await forwardToBackend(request, endpoint, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(`Backend request failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Forward POST request to backend
 */
export async function forwardPost<T = unknown>(
  request: Request,
  endpoint: string,
  data?: unknown
): Promise<T> {
  const response = await forwardToBackend(request, endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    throw new Error(`Backend request failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Forward PUT request to backend
 */
export async function forwardPut<T = unknown>(
  request: Request,
  endpoint: string,
  data?: unknown
): Promise<T> {
  const response = await forwardToBackend(request, endpoint, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    throw new Error(`Backend request failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Forward DELETE request to backend
 */
export async function forwardDelete<T = unknown>(
  request: Request,
  endpoint: string
): Promise<T> {
  const response = await forwardToBackend(request, endpoint, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Backend request failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Exchange App Bridge session token for expiring offline access token
 * Uses Shopify OAuth token exchange endpoint
 * Returns an expiring offline access token with refresh token (90-day refresh token lifetime)
 * 
 * POST https://{shop}.myshopify.com/admin/oauth/access_token
 * 
 * According to Shopify documentation:
 * - Using expiring=1 returns an expiring offline access token with refresh token
 * - Access tokens expire (typically 1 hour)
 * - Refresh tokens have a 90-day lifetime (7776000 seconds)
 * - Apps can refresh expired tokens without merchant intervention
 * - Only one expiring offline token can be active per app/shop combination
 * 
 * Reference: https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/offline-access-tokens
 * 
 * @param sessionToken - App Bridge session token
 * @param shop - Shop domain (e.g., "your-shop.myshopify.com")
 * @returns Promise with expiring offline access token and refresh token
 */
export async function exchangeSessionTokenForAccessToken(
  sessionToken: string,
  shop: string
): Promise<{ 
  access_token: string; 
  refresh_token?: string;
  expires_in?: number;
  refresh_token_expires_in?: number;
  scope?: string;
}> {
  const tokenExchangeUrl = `https://${shop}/admin/oauth/access_token`;
  
  console.log("🔄 Exchanging session token for offline access token...");
  console.log("📤 Token Exchange URL:", tokenExchangeUrl);
  console.log("🏪 Shop:", shop);
  
  const formData = new URLSearchParams({
    client_id: SHOPIFY_API_KEY,
    client_secret: SHOPIFY_API_SECRET,
    grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
    subject_token: sessionToken,
    subject_token_type: "urn:ietf:params:oauth:token-type:id_token",
    requested_token_type: "urn:shopify:params:oauth:token-type:offline-access-token",
    expiring: "1", // 1 for expiring offline token (with refresh token, 90-day lifetime)
  });

  try {
    const response = await fetch(tokenExchangeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Token exchange failed:", errorText);
      throw new Error(`Token exchange failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log("✅ Token exchange successful");
    console.log("🔑 Expiring Offline Access Token received");
    console.log("🔄 Refresh Token:", data.refresh_token ? "Received (90-day lifetime)" : "Not provided");
    console.log("⏰ Access Token Expires in:", data.expires_in ? `${data.expires_in} seconds (${Math.round(data.expires_in / 60)} minutes)` : "N/A");
    console.log("⏰ Refresh Token Expires in:", data.refresh_token_expires_in ? `${data.refresh_token_expires_in} seconds (90 days)` : "N/A");
    console.log("📋 Scope:", data.scope || "N/A");
    
    return data;
  } catch (error) {
    console.error("❌ Token exchange error:", error);
    throw error;
  }
}

/**
 * Get shop domain from request headers or URL
 */
export function getShopFromRequest(request: Request): string | null {
  // Try to get shop from headers
  const shopHeader = request.headers.get("x-shopify-shop-domain");
  if (shopHeader) {
    return shopHeader;
  }

  // Try to extract from URL
  const url = new URL(request.url);
  const shopParam = url.searchParams.get("shop");
  if (shopParam) {
    return shopParam;
  }

  return null;
}
