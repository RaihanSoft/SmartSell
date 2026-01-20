import { Suspense, useEffect } from "react";
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";

import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  // eslint-disable-next-line no-undef
  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();

  // Fetch and log installation logs to Chrome console
  useEffect(() => {
    // Always log to verify the script is running
    console.log("🚀 App component mounted - checking for installation logs...");
    console.log("📍 Current URL:", window.location.href);
    
    const fetchAndLogInstallationLogs = async (attempt = 1) => {
      try {
        console.log(`📡 Fetching installation logs (attempt ${attempt})...`);
        const response = await fetch("/api/installation-logs");
        
        console.log("📥 Response status:", response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log("📋 Response data:", data);
          
          if (data.success) {
            if (data.logs && data.logs.length > 0) {
              console.group("🔔 App Installation Logs");
              console.log(`Shop: ${data.shop}`);
              console.log(`Total logs: ${data.logs.length}`);
              console.log("---");
              
              data.logs.forEach((log: any, index: number) => {
                console.group(`Log ${index + 1} - ${log.status === "success" ? "✅" : "❌"} ${new Date(log.timestamp).toLocaleTimeString()}`);
                console.log("Shop:", log.shop);
                console.log("Auth URL:", log.authUrl);
                console.log("Status:", log.status);
                console.log("Message:", log.message);
                if (log.backendResponse) {
                  console.log("Backend Response:", log.backendResponse);
                }
                console.groupEnd();
              });
              
              console.groupEnd();
            } else {
              console.log("ℹ️ No installation logs found yet. The afterAuth hook may not have run yet.");
              // Retry a few times if no logs found (in case afterAuth is still running)
              if (attempt < 5) {
                setTimeout(() => fetchAndLogInstallationLogs(attempt + 1), 2000);
              }
            }
          } else {
            console.warn("⚠️ Failed to get logs:", data.error || data.message);
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error("❌ Failed to fetch installation logs:", response.status, errorData);
        }
      } catch (error) {
        console.error("❌ Error fetching installation logs:", error);
        // Retry on error
        if (attempt < 3) {
          setTimeout(() => fetchAndLogInstallationLogs(attempt + 1), 2000);
        }
      }
    };

    // Fetch logs after a delay to ensure afterAuth has completed
    // Try multiple times to catch logs even if afterAuth takes longer
    const timeoutId1 = setTimeout(() => fetchAndLogInstallationLogs(1), 2000);
    const timeoutId2 = setTimeout(() => fetchAndLogInstallationLogs(2), 5000);
    const timeoutId3 = setTimeout(() => fetchAndLogInstallationLogs(3), 10000);
    
    return () => {
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
      clearTimeout(timeoutId3);
    };
  }, []);

  return (
    <AppProvider embedded apiKey={apiKey}>
      <s-app-nav>
        <s-link href="/app/customize">Customize</s-link>
        <s-link href="/app/integrations">Integrations</s-link>
        <s-link href="/app/help">Help</s-link>
        <s-link href="/app/refer-earn">Refer & Earn</s-link>
        <s-link href="/app/test-session">Test Session Token</s-link>
        <s-link href="/app/exten">Test Extension</s-link>
      </s-app-nav>
      
      {/* Persistent App Header - follows Polaris pattern */}
      {/* <div style={{ 
        padding: "var(--p-space-400) var(--p-space-500)",
        borderBottom: "1px solid var(--p-border-subdued)",
        backgroundColor: "var(--p-surface)",
      }}>
      </div> */}

      <Suspense
        fallback={
          <s-page>
            <s-section>
              <s-stack direction="block" gap="base" alignItems="center">
                <s-spinner />
                <s-text >Loading...</s-text>
              </s-stack>
            </s-section>
          </s-page>
        }
      >
        <Outlet />
      </Suspense>
    </AppProvider>
  );
}

// Shopify needs React Router to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
