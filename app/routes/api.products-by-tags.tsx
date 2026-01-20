import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

/**
 * API endpoint to fetch products by tags
 * GET /api/products-by-tags?query={searchQuery}
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const { admin } = await authenticate.admin(request);
    const url = new URL(request.url);
    const searchQuery = url.searchParams.get("query") || "";

    // Build GraphQL query filter string
    // If no search query, return all products that have tags (tag:*)
    // If search query provided, filter by matching tags
    let queryFilter: string | undefined;
    if (searchQuery.trim()) {
      const searchTerm = searchQuery.trim().replace(/'/g, "\\'");
      // Search by tags - tags field in Shopify
      queryFilter = `tag:*${searchTerm}*`;
    } else {
      // Return all products that have at least one tag
      queryFilter = "tag:*";
    }

    const graphqlQuery = `
      query searchProductsByTags($first: Int!, $query: String) {
        products(first: $first, query: $query) {
          nodes {
            id
            title
            handle
            productType
            vendor
            tags
            featuredImage {
              url
              altText
            }
            status
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

    const data = await response.json();
    const products = data?.data?.products?.nodes || [];

    return Response.json({
      success: true,
      products: products.map((p: any) => ({
        id: p.id,
        title: p.title,
        handle: p.handle,
        productType: p.productType,
        vendor: p.vendor,
        tags: p.tags || [],
        image: p.featuredImage?.url || null,
        imageAlt: p.featuredImage?.altText || p.title,
        status: p.status,
      })),
      count: products.length,
    });
  } catch (error) {
    console.error("Error fetching products by tags:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to fetch products by tags",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
