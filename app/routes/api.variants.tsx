import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

/**
 * API endpoint to search product variants by keyword
 * GET /api/variants?query={searchQuery}
 *
 * Uses Shopify Admin GraphQL API (ApiVersion.October25).
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const { admin } = await authenticate.admin(request);
    const url = new URL(request.url);
    const searchQuery = url.searchParams.get("query") || "";

    // Build GraphQL query filter string
    // Match variant title, SKU, or product title
    let queryFilter: string | undefined;
    if (searchQuery.trim()) {
      const searchTerm = searchQuery.trim().replace(/'/g, "\\'");
      queryFilter = `title:*${searchTerm}* OR sku:*${searchTerm}* OR product_title:*${searchTerm}*`;
    }

    const graphqlQuery = `
      query searchVariants($first: Int!, $query: String) {
        productVariants(first: $first, query: $query) {
          nodes {
            id
            title
            sku
            displayName
            image {
              url
              altText
            }
            product {
              id
              title
              handle
            }
          }
        }
      }
    `;

    const variables: any = {
      first: 50,
    };

    if (queryFilter) {
      variables.query = queryFilter;
    }

    const response = await admin.graphql(graphqlQuery, {
      variables,
    });

    const data: any = await response.json();

    if (data.errors) {
      console.error("GraphQL errors (variants):", JSON.stringify(data.errors, null, 2));
      return Response.json(
        {
          success: false,
          error: "GraphQL errors",
          errors: data.errors,
          message: data.errors[0]?.message || "Unknown GraphQL error",
        },
        { status: 500 },
      );
    }

    const variants = data?.data?.productVariants?.nodes || [];

    return Response.json({
      success: true,
      variants: variants.map((v: any) => ({
        id: v.id,
        title: v.displayName || v.title || "",
        sku: v.sku || "",
        productId: v.product?.id || null,
        productTitle: v.product?.title || "",
        productHandle: v.product?.handle || "",
        image: v.image?.url || null,
        imageAlt: v.image?.altText || v.displayName || v.title || v.product?.title || "",
      })),
      count: variants.length,
    });
  } catch (error) {
    console.error("Error searching variants:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to search variants",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
};

