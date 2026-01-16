import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const { admin } = await authenticate.admin(request);

    // Query for checkout profiles - get the published profile first
    const response = await admin.graphql(`
      query getCheckoutProfiles {
        checkoutProfiles(first: 1, sortKey: UPDATED_AT, reverse: true) {
          nodes {
            id
            isPublished
          }
        }
      }
    `);

    const data = await response.json();
    
    // Extract profile ID from the response
    // The ID format is usually "gid://shopify/CheckoutProfile/{id}"
    // Prefer published profile, otherwise use the first one
    const profiles = data?.data?.checkoutProfiles?.nodes || [];
    const publishedProfile = profiles.find((p: any) => p.isPublished) || profiles[0];
    const profileId = publishedProfile?.id;
    
    if (profileId) {
      // Extract numeric ID from GID format: "gid://shopify/CheckoutProfile/3706912837" -> "3706912837"
      const numericId = profileId.split('/').pop();
      return Response.json({ profileId: numericId });
    }

    return Response.json({ profileId: null });
  } catch (error) {
    console.error("Error fetching checkout profile:", error);
    return Response.json({ profileId: null }, { status: 500 });
  }
};
