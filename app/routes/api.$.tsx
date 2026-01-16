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
 * Handle GET requests (loaders)
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    // Extract the path after /api/
    const url = new URL(request.url);
    const backendPath = url.pathname.replace(/^\/api/, "");
    
    console.log("🔄 Forwarding request to backend:", backendPath);
    console.log("📋 Request headers:", Object.fromEntries(request.headers.entries()));
    
    // Forward request to backend with session token
    const response = await forwardToBackend(request, backendPath, {
      method: "GET",
    });

    console.log("✅ Backend response status:", response.status);
    
    // Return response with proper headers
    const data = await response.text();
    
    return new Response(data, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/json",
      },
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
    // Extract the path after /api/
    const url = new URL(request.url);
    const backendPath = url.pathname.replace(/^\/api/, "");
    
    console.log("🔄 Forwarding request to backend:", backendPath);
    console.log("📋 Request method:", request.method);
    console.log("📋 Request headers:", Object.fromEntries(request.headers.entries()));
    
    // Get request body if present
    let body: string | undefined;
    if (request.method !== "GET" && request.method !== "HEAD") {
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
    
    return new Response(data, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/json",
      },
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
