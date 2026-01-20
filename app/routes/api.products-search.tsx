import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

/**
 * API endpoint to search products by type and keyword
 * GET /api/products-search?type={productType}&query={searchQuery}
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const { admin } = await authenticate.admin(request);
    const url = new URL(request.url);
    const productType = url.searchParams.get("type") || "";
    const searchQuery = url.searchParams.get("query") || "";

    // Build GraphQL query filter string
    const filters: string[] = [];
    if (productType) {
      filters.push(`product_type:'${productType.replace(/'/g, "\\'")}'`);
    }
    if (searchQuery.trim()) {
      const searchTerm = searchQuery.trim().replace(/'/g, "\\'");
      filters.push(`title:*${searchTerm}* OR vendor:*${searchTerm}*`);
    }

    const queryFilter = filters.length > 0 ? filters.join(" AND ") : undefined;

    const graphqlQuery = `
      query searchProducts($first: Int!, $query: String) {
        products(first: $first, query: $query) {
          nodes {
            id
            title
            handle
            productType
            vendor
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
        image: p.featuredImage?.url || null,
        imageAlt: p.featuredImage?.altText || p.title,
        status: p.status,
      })),
      count: products.length,
    });
  } catch (error) {
    console.error("Error searching products:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to search products",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
