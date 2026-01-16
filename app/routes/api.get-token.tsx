import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { getSessionTokenFromRequest } from "../utils/api.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    // Authenticate to ensure we're in a valid session
    await authenticate.admin(request);
    
    // Extract session token from request headers (added by App Bridge)
    const sessionToken = getSessionTokenFromRequest(request);
    
    if (!sessionToken) {
      return Response.json(
        {
          success: false,
          error: "No session token provided",
          message: "App Bridge session token not found in request headers",
        },
        { status: 401 }
      );
    }

    return Response.json({
      success: true,
      token: sessionToken,
      message: "Session token retrieved successfully",
    });
  } catch (error) {
    console.error("❌ Get token error:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to get session token",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
