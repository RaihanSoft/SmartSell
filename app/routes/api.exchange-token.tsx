import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { getSessionTokenFromRequest, exchangeSessionTokenForAccessToken, getShopFromRequest } from "../utils/api.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    // Authenticate to get shop from session
    const { session } = await authenticate.admin(request);
    const shop = session?.shop;
    
    if (!shop) {
      return Response.json(
        {
          success: false,
          error: "Shop domain not found in session",
        },
        { status: 400 }
      );
    }

    // Extract session token from request headers
    const sessionToken = getSessionTokenFromRequest(request);
    
    if (!sessionToken) {
      return Response.json(
        {
          success: false,
          error: "No session token provided",
        },
        { status: 401 }
      );
    }

    console.log("🔄 Exchanging session token for expiring offline access token...");
    console.log("🏪 Shop:", shop);
    console.log("🔑 Session Token:", sessionToken.substring(0, 30) + "...");
    
    // Exchange session token for expiring offline access token
    const tokenData = await exchangeSessionTokenForAccessToken(sessionToken, shop);
    
    console.log("✅ Token exchange successful");
    console.log("🔑 Expiring Offline Access Token:", tokenData.access_token);
    console.log("🔄 Refresh Token:", tokenData.refresh_token ? "Received (90-day lifetime)" : "Not provided");
    console.log("⏰ Access Token Expires in:", tokenData.expires_in ? `${tokenData.expires_in} seconds (${Math.round(tokenData.expires_in / 60)} minutes)` : "N/A");
    console.log("⏰ Refresh Token Expires in:", tokenData.refresh_token_expires_in ? `${tokenData.refresh_token_expires_in} seconds (90 days)` : "N/A");
    
    return Response.json({
      success: true,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      refresh_token_expires_in: tokenData.refresh_token_expires_in,
      scope: tokenData.scope,
      shop: shop,
      message: "Expiring offline access token obtained successfully",
      note: "This is an expiring offline access token. The access token expires (typically 1 hour). Use the refresh token to obtain new tokens without merchant intervention. Refresh token has a 90-day lifetime.",
    });
  } catch (error) {
    console.error("❌ Token exchange error:", error);
    return Response.json(
      {
        success: false,
        error: "Token exchange failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
