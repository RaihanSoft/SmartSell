/**
 * API endpoint for fetching campaign offers
 * GET/POST /api/campaigns/offers
 * 
 * PROXY FLOW:
 * 1. Extension/Client calls: /api/campaigns/offers
 * 2. This route receives the request
 * 3. This route proxies to: BACKEND_API_URL/campaigns/offers
 * 4. Backend response is returned to the client
 * 
 * Used by both admin app and checkout extensions (thank-you page).
 * 
 * Query Parameters:
 * - surface: The surface where offers will be displayed (e.g., "thank-you-page", "product_page")
 * - productIds: Comma-separated list of product IDs (GID format)
 * 
 * For POST requests, body can contain:
 * - surface: string
 * - productIds: string[] or comma-separated string
 */

import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { forwardToBackend } from "../utils/api.server";
import prisma from "../db.server";

/**
 * Handle GET requests (loaders)
 * GET /api/campaigns/offers?surface=thank-you-page&productIds=gid://shopify/Product/123
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const url = new URL(request.url);
    const backendPath = "/campaigns/offers" + (url.search || "");
    
    console.log("📥 [PROXY] Received GET request at /api/campaigns/offers");
    console.log("🔄 [PROXY] Forwarding to backend:", backendPath);
    console.log("📋 [PROXY] Request headers:", Object.fromEntries(request.headers.entries()));
    
    // Check if this is an extension request (no authorization header)
    const hasAuth = request.headers.get("authorization");
    const isExtensionRequest = !hasAuth;
    const shopDomain = url.searchParams.get("shop");
    
    // For extension requests without session token, try to get shop's access token
    let extensionAccessToken: string | null = null;
    if (isExtensionRequest && shopDomain) {
      try {
        // Look up the shop's stored access token from database
        const session = await prisma.session.findFirst({
          where: {
            shop: shopDomain,
            isOnline: false, // Use offline token
          },
          orderBy: {
            expires: 'desc', // Get most recent token
          },
        });
        
        if (session?.accessToken) {
          extensionAccessToken = session.accessToken;
          console.log("✅ [PROXY] Found access token for shop:", shopDomain);
        } else {
          console.warn("⚠️ [PROXY] No access token found for shop:", shopDomain);
        }
      } catch (error) {
        console.error("❌ [PROXY] Error looking up shop token:", error);
      }
    }
    
    // Forward request to backend with session token or shop access token
    const response = await forwardToBackend(request, backendPath, {
      method: "POST",
      shopAccessToken: extensionAccessToken || undefined, // Pass shop token for extension requests
    });

    console.log("✅ [PROXY] Backend response status:", response.status);
    
    // Return response with proper headers and CORS
    const data = await response.text();
    
    // Get origin from request for CORS
    const origin = request.headers.get("origin");
    const headers = new Headers({
      "Content-Type": response.headers.get("Content-Type") || "application/json",
    });

    // Always add CORS headers to allow checkout extensions to call this API
    // Use origin if available, otherwise allow all (for development)
    headers.set("Access-Control-Allow-Origin", origin || "*");
    headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (origin) {
      headers.set("Access-Control-Allow-Credentials", "true");
    }

    console.log("📤 [PROXY] Returning response to client with CORS headers");

    return new Response(data, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (error) {
    console.error("❌ Error forwarding request to backend:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch offers",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};

/**
 * Handle POST requests (actions)
 * POST /api/campaigns/offers
 * Body: { surface: "thank-you-page", productIds: ["gid://shopify/Product/123"] }
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const url = new URL(request.url);
    
    console.log("📥 [PROXY] Received POST request at /api/campaigns/offers");
    
    // Check if this is an extension request (no authorization header)
    const hasAuth = request.headers.get("authorization");
    const isExtensionRequest = !hasAuth;
    
    // Get data from request body or query params
    let backendPath = "/campaigns/offers";
    let shopDomain: string | null = null;
    
    if (request.method === "POST") {
      // Try to get data from body
      try {
        const requestBody = await request.json();
        console.log("📦 [PROXY] Request body:", JSON.stringify(requestBody));
        
        // Extract shop domain from request body (for extension requests)
        if (isExtensionRequest && requestBody.shop) {
          shopDomain = requestBody.shop;
          console.log("🏪 [PROXY] Extension request detected, shop:", shopDomain);
        }
        
        // Build query string from body data
        const params = new URLSearchParams();
        if (requestBody.surface) {
          params.set("surface", requestBody.surface);
        }
        if (requestBody.productIds) {
          const productIds = Array.isArray(requestBody.productIds) 
            ? requestBody.productIds.join(",")
            : requestBody.productIds;
          params.set("productIds", productIds);
        }
        
        if (params.toString()) {
          backendPath += "?" + params.toString();
        }
      } catch (error) {
        // If body parsing fails, use query string from URL
        console.log("⚠️ [PROXY] Could not parse body, using URL query params");
        backendPath += url.search || "";
        shopDomain = url.searchParams.get("shop");
      }
    } else {
      backendPath += url.search || "";
      shopDomain = url.searchParams.get("shop");
    }
    
    console.log("🔄 [PROXY] Forwarding to backend:", backendPath);
    console.log("📋 [PROXY] Request method:", request.method);
    console.log("📋 [PROXY] Request headers:", Object.fromEntries(request.headers.entries()));
    console.log("🔐 [PROXY] Is extension request:", isExtensionRequest);
    console.log("🏪 [PROXY] Shop domain:", shopDomain);
    
    // For extension requests without session token, try to get shop's access token
    let extensionAccessToken: string | null = null;
    if (isExtensionRequest) {
      if (shopDomain) {
        try {
          // Look up the shop's stored access token from database
          const session = await prisma.session.findFirst({
            where: {
              shop: shopDomain,
              isOnline: false, // Use offline token
            },
            orderBy: {
              expires: 'desc', // Get most recent token
            },
          });
          
          if (session?.accessToken) {
            extensionAccessToken = session.accessToken;
            console.log("✅ [PROXY] Found access token for shop:", shopDomain);
          } else {
            console.warn("⚠️ [PROXY] No access token found for shop:", shopDomain);
            // Try to find any session for this shop (including expired ones)
            const anySession = await prisma.session.findFirst({
              where: {
                shop: shopDomain,
                isOnline: false,
              },
            });
            if (anySession?.accessToken) {
              extensionAccessToken = anySession.accessToken;
              console.log("✅ [PROXY] Found access token (including expired sessions) for shop:", shopDomain);
            }
          }
        } catch (error) {
          console.error("❌ [PROXY] Error looking up shop token:", error);
        }
      } else {
        console.warn("⚠️ [PROXY] Extension request without shop domain - backend may need to handle authentication differently");
      }
    }
    
    // Forward request to backend with session token or shop access token
    const response = await forwardToBackend(request, backendPath, {
      method: "GET", // Backend expects GET with query params
      shopAccessToken: extensionAccessToken || undefined, // Pass shop token for extension requests
    });

    console.log("✅ [PROXY] Backend response status:", response.status);
    
    // Return response
    const data = await response.text();
    
    // Log error responses
    if (!response.ok) {
      console.error("❌ [PROXY] Backend error response:", data.substring(0, 500));
    }
    
    // Get origin from request for CORS
    const origin = request.headers.get("origin");
    const headers = new Headers({
      "Content-Type": response.headers.get("Content-Type") || "application/json",
    });

    // Always add CORS headers to allow checkout extensions to call this API
    // Use origin if available, otherwise allow all (for development)
    headers.set("Access-Control-Allow-Origin", origin || "*");
    headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (origin) {
      headers.set("Access-Control-Allow-Credentials", "true");
    }

    console.log("📤 [PROXY] Returning response to client with CORS headers");

    return new Response(data, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (error) {
    console.error("❌ Error forwarding request to backend:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch offers",
        message: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : undefined,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};

/**
 * Handle OPTIONS requests (CORS preflight)
 */
export const options = async ({ request }: LoaderFunctionArgs) => {
  console.log("📥 [PROXY] Received OPTIONS (CORS preflight) request");
  
  const origin = request.headers.get("origin");
  const headers = new Headers({
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400", // 24 hours
  });

  console.log("✅ [PROXY] Returning CORS preflight response");

  return new Response(null, {
    status: 204,
    headers,
  });
};
