import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

/**
 * API endpoint to fetch all unique tags from Shopify products
 * GET /api/tags?query={searchQuery}
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const { admin } = await authenticate.admin(request);
    const url = new URL(request.url);
    const searchQuery = url.searchParams.get("query") || "";

    // Fetch products with tags - we'll extract unique tags from them
    // Use pagination to get all products (up to 250 per query)
    let allTags: string[] = [];
    let hasNextPage = true;
    let cursor: string | null = null;
    const pageSize = 250;

    while (hasNextPage && allTags.length < 1000) {
      // Build GraphQL query with cursor-based pagination
      const graphqlQuery = `
        query getProductsWithTags($first: Int!, $after: String) {
          products(first: $first, after: $after) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              tags
            }
          }
        }
      `;

      const variables: any = {
        first: pageSize,
      };

      if (cursor) {
        variables.after = cursor;
      }

      const response = await admin.graphql(graphqlQuery, {
        variables,
      });

      const data: any = await response.json();

      // Check for GraphQL errors
      if (data.errors) {
        console.error("GraphQL errors:", JSON.stringify(data.errors, null, 2));
        return Response.json(
          {
            success: false,
            error: "GraphQL errors",
            errors: data.errors,
            message: data.errors[0]?.message || "Unknown GraphQL error",
          },
          { status: 500 }
        );
      }

      const products = data?.data?.products?.nodes || [];
      const pageInfo = data?.data?.products?.pageInfo || {};

      // Extract tags from products
      products.forEach((product: any) => {
        if (product.tags && Array.isArray(product.tags)) {
          allTags.push(...product.tags);
        }
      });

      // Update pagination
      hasNextPage = pageInfo.hasNextPage || false;
      cursor = pageInfo.endCursor || null;
    }

    // Get unique tags and sort them
    const uniqueTags = Array.from(new Set(allTags))
      .filter((tag: string) => tag && tag.trim() !== "")
      .sort();

    // Filter by search query if provided
    let filteredTags = uniqueTags;
    if (searchQuery.trim()) {
      const searchTerm = searchQuery.trim().toLowerCase();
      filteredTags = uniqueTags.filter((tag: string) =>
        tag.toLowerCase().includes(searchTerm)
      );
    }

    // Count products for each tag (optional - can be expensive, so we'll do a simplified version)
    // For now, we'll return tags without product counts to keep it fast
    // If needed, we can enhance this later

    return Response.json({
      success: true,
      tags: filteredTags.map((tag: string) => ({
        name: tag,
        id: tag, // Use tag name as ID for simplicity
      })),
      count: filteredTags.length,
    });
  } catch (error) {
    console.error("Error fetching tags:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to fetch tags",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
