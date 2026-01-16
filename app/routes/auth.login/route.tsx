import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Form, useActionData, useLoaderData } from "react-router";

import { login } from "../../shopify.server";
import { loginErrorMessage } from "./error.server";
import type { AuthQueryDto } from "../types/auth.types";

/**
 * Login route handler
 * Handles authentication with query parameters: shop, embedded, host
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  
  // Extract query parameters matching AuthQueryDto interface
  const authParams: AuthQueryDto = {
    shop: url.searchParams.get("shop") || undefined,
    embedded: url.searchParams.get("embedded") || undefined,
    host: url.searchParams.get("host") || undefined,
  };

  const errors = loginErrorMessage(await login(request));

  return { errors, authParams };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const url = new URL(request.url);
  
  // Extract query parameters matching AuthQueryDto interface
  const authParams: AuthQueryDto = {
    shop: url.searchParams.get("shop") || undefined,
    embedded: url.searchParams.get("embedded") || undefined,
    host: url.searchParams.get("host") || undefined,
  };

  const errors = loginErrorMessage(await login(request));

  return {
    errors,
    authParams,
  };
};

export default function Auth() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [shop, setShop] = useState("");
  const { errors } = actionData || loaderData;

  return (
    <AppProvider embedded={false}>
      <s-page>
        <Form method="post">
        <s-section heading="Log in">
          <s-text-field
            name="shop"
            label="Shop domain"
            details="example.myshopify.com"
            value={shop}
            onChange={(e) => setShop(e.currentTarget.value)}
            autocomplete="on"
            error={errors.shop}
          ></s-text-field>
          <s-button type="submit">Log in</s-button>
        </s-section>
        </Form>
      </s-page>
    </AppProvider>
  );
}
