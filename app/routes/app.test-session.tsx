/**
 * Test Session Token Route
 * Exchange App Bridge session token for offline access token
 */

import { useState } from "react";
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { useAppBridge } from "@shopify/app-bridge-react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return {};
};

export default function TestSession() {
  const shopify = useAppBridge();
  const [loading, setLoading] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get session token from server (App Bridge automatically adds it to fetch requests)
  const getSessionToken = async () => {
    try {
      const response = await fetch("/api/get-token", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSessionToken(data.token);
        console.log("Session Token:", data.token);
      }
    } catch (err) {
      console.error("Failed to get session token:", err);
    }
  };

  const getAccessToken = async () => {
    setLoading(true);
    setError(null);
    setAccessToken(null);

    try {
      // App Bridge automatically adds session token to fetch requests
      const response = await fetch("/api/exchange-token", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || "Token exchange failed");
      }

      const data = await response.json();
      setAccessToken(data.access_token);
      shopify.toast.show("Access token obtained successfully!");
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      shopify.toast.show("Failed to get access token", { isError: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <s-page>
      <s-section>
        <s-stack direction="block" gap="base">
          <s-heading>Get Access Token</s-heading>
          
          <s-paragraph>
            Use App Bridge to exchange session token for offline access token.
          </s-paragraph>

          <s-stack direction="block" gap="small">
            <s-button
              variant="secondary"
              onClick={getSessionToken}
            >
              Get Session Token
            </s-button>

            {sessionToken && (
              <s-box borderRadius="base" padding="base">
                <div style={{ backgroundColor: "var(--p-color-bg-info-subdued)", padding: "var(--p-space-400)", borderRadius: "var(--p-border-radius-base)" }}>
                  <s-stack direction="block" gap="small">
                    <s-heading>Session Token (from App Bridge)</s-heading>
                    <s-paragraph>
                      <code style={{ 
                        display: "block",
                        background: "var(--p-surface-subdued)", 
                        padding: "var(--p-space-400)", 
                        borderRadius: "var(--p-border-radius-base)",
                        overflow: "auto",
                        fontSize: "12px",
                        wordBreak: "break-all"
                      }}>
                        {sessionToken}
                      </code>
                    </s-paragraph>
                  </s-stack>
                </div>
              </s-box>
            )}
          </s-stack>

          <s-button
            variant="primary"
            onClick={getAccessToken}
            loading={loading}
          >
            {loading ? "Getting Token..." : "Get Access Token"}
          </s-button>

          {error && (
            <s-box borderRadius="base" padding="base">
              <div style={{ backgroundColor: "var(--p-color-bg-critical-subdued)", padding: "var(--p-space-400)", borderRadius: "var(--p-border-radius-base)" }}>
                <s-stack direction="block" gap="small">
                  <s-heading>Error</s-heading>
                  <s-paragraph>{error}</s-paragraph>
                </s-stack>
              </div>
            </s-box>
          )}

          {accessToken && (
            <s-box borderRadius="base" padding="base">
              <div style={{ backgroundColor: "var(--p-color-bg-success-subdued)", padding: "var(--p-space-400)", borderRadius: "var(--p-border-radius-base)" }}>
                <s-stack direction="block" gap="small">
                  <s-heading>Access Token</s-heading>
                  <s-paragraph>
                    <code style={{ 
                      display: "block",
                      background: "var(--p-surface-subdued)", 
                      padding: "var(--p-space-400)", 
                      borderRadius: "var(--p-border-radius-base)",
                      overflow: "auto",
                      fontSize: "14px",
                      wordBreak: "break-all"
                    }}>
                      {accessToken}
                    </code>
                  </s-paragraph>
                </s-stack>
              </div>
            </s-box>
          )}
        </s-stack>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
