import { Suspense } from "react";
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
