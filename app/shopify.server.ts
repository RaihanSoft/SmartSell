import "@shopify/shopify-app-react-router/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-react-router/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";
import { storeInstallationLog } from "./utils/installation-logs.server";
const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.October25,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  future: {
    expiringOfflineAccessTokens: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
  hooks: {
    afterAuth: async ({ session }) => {
      console.log("🔔 afterAuth hook triggered");
      console.log("📋 Session data:", {
        shop: session?.shop,
        hasAccessToken: !!session?.accessToken,
        sessionId: session?.id,
      });
      
      // Send GET request to backend with session token when app is installed
      if (session?.shop && session?.accessToken) {
        const backendUrl = process.env.BACKEND_API_URL || "https://agaricaceous-breana-floggingly.ngrok-free.dev";
        // Ensure URL has protocol
        const baseUrl = backendUrl.startsWith("http") ? backendUrl : `https://${backendUrl}`;
        const authUrl = `${baseUrl}/auth?shop=${encodeURIComponent(session.shop)}`;
        console.log("🔗 authUrl:", authUrl);
        
        try {
          console.log(`🔄 App installed for ${session.shop}, sending GET to backend with session token...`);
          console.log(`📤 GET ${authUrl}`);
          
          const response = await fetch(authUrl, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${session.accessToken}`,
              "X-Shopify-Shop-Domain": session.shop,
            },
          });
          
          if (response.ok) {
            const responseText = await response.text().catch(() => "");
            console.log(`✅ Successfully sent GET to backend for ${session.shop}`);
            console.log(`📥 Backend response: ${responseText.substring(0, 200)}`);
            
            // Store log for client-side display
            storeInstallationLog(session.shop, {
              shop: session.shop,
              authUrl,
              status: "success",
              message: `Successfully sent GET to backend`,
              backendResponse: responseText.substring(0, 200),
            });
          } else {
            const errorText = await response.text().catch(() => "");
            console.error(`❌ Backend returned status ${response.status} for ${session.shop}`);
            console.error(`📥 Error response: ${errorText.substring(0, 200)}`);
            
            // Store error log
            storeInstallationLog(session.shop, {
              shop: session.shop,
              authUrl,
              status: "error",
              message: `Backend returned status ${response.status}`,
              backendResponse: errorText.substring(0, 200),
            });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          console.error(`❌ Failed to send GET to backend for ${session.shop}:`, error);
          
          // Store error log
          storeInstallationLog(session.shop, {
            shop: session.shop,
            authUrl,
            status: "error",
            message: `Failed to send GET: ${errorMessage}`,
          });
        }
      } else {
        console.warn("⚠️ afterAuth hook: Missing shop or accessToken", {
          shop: session?.shop,
          hasAccessToken: !!session?.accessToken,
        });
      }
    },
  },
});

export default shopify;
export const apiVersion = ApiVersion.October25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
