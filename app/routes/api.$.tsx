/**
 * API Proxy Route
 * Forwards requests to backend with App Bridge session token
 * This route acts as a proxy between frontend and backend
 * 
 * Usage: /api/* -> forwards to BACKEND_API_URL/*
 */

import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { forwardToBackend } from "../utils/api.server";

/**
 * Handle OPTIONS requests (CORS preflight)
 */
export const options = async ({ request }: LoaderFunctionArgs) => {
  const origin = request.headers.get("origin");
  const headers = new Headers({
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400", // 24 hours
  });

  return new Response(null, {
    status: 204,
    headers,
  });
};

/**
 * Handle GET requests (loaders)
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    // Extract the path after /api/ and preserve query string
    const url = new URL(request.url);
    const backendPath = url.pathname.replace(/^\/api/, "") + (url.search || "");
    
    console.log("🔄 Forwarding request to backend:", backendPath);
    console.log("📋 Request headers:", Object.fromEntries(request.headers.entries()));
    
    // Forward request to backend with session token
    const response = await forwardToBackend(request, backendPath, {
      method: "POST",
    });

    console.log("✅ Backend response status:", response.status);
    
    // Return response with proper headers
    const data = await response.text();
    
    // Get origin from request for CORS
    const origin = request.headers.get("origin");
    const headers = new Headers({
      "Content-Type": response.headers.get("Content-Type") || "application/json",
    });

    // Add CORS headers to allow checkout extensions to call this API
    if (origin) {
      headers.set("Access-Control-Allow-Origin", origin);
      headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
      headers.set("Access-Control-Allow-Credentials", "true");
    }

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
        error: "Failed to forward request to backend",
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
 * Handle POST/PUT/DELETE requests (actions)
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    // Extract the path after /api/ and preserve query string
    const url = new URL(request.url);
    const backendPath = url.pathname.replace(/^\/api/, "") + (url.search || "");
    
    console.log("🔄 Forwarding request to backend:", backendPath);
    console.log("📋 Request method:", request.method);
    console.log("📋 Request headers:", Object.fromEntries(request.headers.entries()));
    
    // Get request body if present
    let body: string | undefined;
    if (request.method !== "POST" && request.method !== "HEAD") {
      body = await request.text();
      console.log("📦 Request body:", body.substring(0, 200)); // Log first 200 chars
    }
    
    // Forward request to backend with session token
    const response = await forwardToBackend(request, backendPath, {
      method: request.method,
      body: body || undefined,
    });

    console.log("✅ Backend response status:", response.status);
    
    // Return response
    const data = await response.text();
    
    // Log error responses
    if (!response.ok) {
      console.error("❌ Backend error response:", data.substring(0, 500));
    }
    
    // Get origin from request for CORS
    const origin = request.headers.get("origin");
    const headers = new Headers({
      "Content-Type": response.headers.get("Content-Type") || "application/json",
    });

    // Add CORS headers to allow checkout extensions to call this API
    if (origin) {
      headers.set("Access-Control-Allow-Origin", origin);
      headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
      headers.set("Access-Control-Allow-Credentials", "true");
    }

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
        error: "Failed to forward request to backend",
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
