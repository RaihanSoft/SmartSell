import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

/**
 * API endpoint to fetch all product types from Shopify
 * GET /api/product-types
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const { admin } = await authenticate.admin(request);

    // Query to get all unique product types
    const response = await admin.graphql(`
      query getProductTypes {
        products(first: 250) {
          nodes {
            productType
          }
        }
      }
    `);

    const data = await response.json();
    const products = data?.data?.products?.nodes || [];
    
    // Extract unique product types
    const productTypes = Array.from(
      new Set(
        products
          .map((p: any) => p.productType)
          .filter((type: string | null) => type && type.trim() !== "")
      )
    ).sort();

    return Response.json({
      success: true,
      productTypes,
    });
  } catch (error) {
    console.error("Error fetching product types:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to fetch product types",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
