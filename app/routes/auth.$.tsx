import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import type { AuthQueryDto } from "../types/auth.types";

/**
 * Authentication route handler
 * Handles OAuth flow with query parameters: shop, embedded, host
 * Follows Shopify OAuth flow requirements
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  
  // Extract query parameters matching AuthQueryDto interface
  const authParams: AuthQueryDto = {
    shop: url.searchParams.get("shop") || undefined,
    embedded: url.searchParams.get("embedded") || undefined,
    host: url.searchParams.get("host") || undefined,
  };

  // Authenticate with Shopify (handles OAuth flow automatically)
  // The authenticate.admin() function uses these query params internally
  await authenticate.admin(request);

  return null;
};

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
