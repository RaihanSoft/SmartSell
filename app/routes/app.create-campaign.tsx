import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import type { HeadersFunction } from "react-router";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

import { useNavigate } from "react-router";

export default function CreateCampaign() {
  const navigate = useNavigate();

  return (
    <s-page>
      {/* Page Header with Back Navigation - follows Polaris pattern */}
      <div style={{ 
        padding: "var(--p-space-400) var(--p-space-500)",
        borderBottom: "1px solid var(--p-border-subdued)",
      }}>
        <s-stack direction="inline" gap="base" alignItems="center">
          <s-button
            variant="plain"
            onClick={() => navigate("/app")}
          >
            ← Create campaign
          </s-button>
        </s-stack>
      </div>

      <s-section heading="Create a New Campaign">
        <s-paragraph>
          Create and manage your campaigns here.
        </s-paragraph>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
