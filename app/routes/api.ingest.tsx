import type { ActionFunctionArgs } from "react-router";

/**
 * API endpoint to receive checkout completion data from Web Pixel
 * POST /api/ingest
 * 
 * This endpoint receives checkout completion events from the SmartSell Web Pixel
 * and processes the order data for analytics and tracking.
 * 
 * NO AUTHENTICATION REQUIRED - This is called from the storefront Web Pixel
 * The Web Pixel runs in the customer's browser, not the admin app
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  // Only accept POST requests
  if (request.method !== "POST") {
    return Response.json(
      { error: "Method not allowed" },
      { status: 405 }
    );
  }

  try {
    // Parse the incoming checkout completion data
    const data = await request.json();

    // Validate required fields
    if (!data.orderId) {
      return Response.json(
        { error: "Missing required field: orderId" },
        { status: 400 }
      );
    }

    if (!data.items || !Array.isArray(data.items)) {
      return Response.json(
        { error: "Missing or invalid field: items" },
        { status: 400 }
      );
    }

    // Validate each item has required fields
    for (const item of data.items) {
      if (!item.productId || !item.variantId || typeof item.quantity !== "number") {
        return Response.json(
          { error: "Invalid item data: missing productId, variantId, or quantity" },
          { status: 400 }
        );
      }
    }

    // Log the checkout completion event
    console.log("📦 Checkout Completed Event Received:");
    console.log("Order ID:", data.orderId);
    console.log("Items:", data.items.length);
    console.log("Total Quantity:", data.totalQuantity);
    console.log("Subtotal:", data.subtotalPrice, data.currencyCode);
    console.log("Timestamp:", data.timestamp);
    console.log("Full payload:", JSON.stringify(data, null, 2));

    // TODO: Process the data as needed
    // Examples:
    // 1. Store in database for analytics
    // 2. Trigger cross-sell recommendations
    // 3. Update inventory tracking
    // 4. Send to external analytics service
    // 5. Trigger email campaigns
    
    // Example: Store in database (uncomment when ready)
    /*
    await db.checkoutEvent.create({
      data: {
        orderId: data.orderId,
        items: JSON.stringify(data.items),
        totalQuantity: data.totalQuantity,
        subtotalPrice: data.subtotalPrice,
        currencyCode: data.currencyCode,
        timestamp: new Date(data.timestamp),
      },
    });
    */

    // Return success response quickly (don't block the Web Pixel)
    return Response.json(
      {
        success: true,
        message: "Checkout event received",
        orderId: data.orderId,
        itemsProcessed: data.items.length,
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          // Allow CORS for Web Pixel requests from Shopify domains
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  } catch (error) {
    console.error("❌ Error processing ingest request:", error);
    
    return Response.json(
      {
        success: false,
        error: "Failed to process checkout event",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};

/**
 * Handle OPTIONS requests for CORS preflight
 */
export const loader = async ({ request }: ActionFunctionArgs) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  // Return info for GET requests (useful for testing)
  return Response.json({
    endpoint: "/api/ingest",
    methods: ["POST"],
    description: "Receives checkout completion events from SmartSell Web Pixel",
    requiredFields: ["orderId", "items"],
    itemFields: ["productId", "variantId", "quantity"],
  });
};
