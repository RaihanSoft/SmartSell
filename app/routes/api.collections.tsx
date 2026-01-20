import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

/**
 * API endpoint to fetch collections
 * GET /api/collections?query={searchQuery}
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const { admin } = await authenticate.admin(request);
    const url = new URL(request.url);
    const searchQuery = url.searchParams.get("query") || "";

    // Build GraphQL query - use different queries based on whether we have a search term
    let graphqlQuery: string;
    let variables: any;

    if (searchQuery.trim()) {
      const searchTerm = searchQuery.trim().replace(/'/g, "\\'");
      const queryFilter = `title:*${searchTerm}*`;
      
      graphqlQuery = `
        query searchCollections($first: Int!, $query: String!) {
          collections(first: $first, query: $query) {
            nodes {
              id
              title
              handle
              description
              image {
                url
                altText
              }
            }
          }
        }
      `;
      
      variables = {
        first: 50,
        query: queryFilter,
      };
    } else {
      // No search query - fetch all collections
      graphqlQuery = `
        query getAllCollections($first: Int!) {
          collections(first: $first) {
            nodes {
              id
              title
              handle
              description
              image {
                url
                altText
              }
            }
          }
        }
      `;
      
      variables = {
        first: 50,
      };
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

    const collections = data?.data?.collections?.nodes || [];

    // Fetch product counts for each collection
    const collectionsWithCounts = await Promise.all(
      collections.map(async (c: any) => {
        try {
          // Query products in this collection
          const productsQuery = `
            query getCollectionProducts($collectionId: ID!) {
              collection(id: $collectionId) {
                productsCount
              }
            }
          `;

          const productsResponse = await admin.graphql(productsQuery, {
            variables: {
              collectionId: c.id,
            },
          });

          const productsData: any = await productsResponse.json();
          const productsCount = productsData?.data?.collection?.productsCount || 0;

          return {
            id: c.id,
            title: c.title,
            handle: c.handle,
            description: c.description || "",
            image: c.image?.url || null,
            imageAlt: c.image?.altText || c.title,
            productsCount,
          };
        } catch (error) {
          console.error(`Error fetching product count for collection ${c.id}:`, error);
          return {
            id: c.id,
            title: c.title,
            handle: c.handle,
            description: c.description || "",
            image: c.image?.url || null,
            imageAlt: c.image?.altText || c.title,
            productsCount: 0,
          };
        }
      })
    );

    return Response.json({
      success: true,
      collections: collectionsWithCounts,
      count: collectionsWithCounts.length,
    });
  } catch (error) {
    console.error("Error fetching collections:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error details:", { errorMessage, errorStack });
    
    return Response.json(
      {
        success: false,
        error: "Failed to fetch collections",
        message: errorMessage,
      },
      { status: 500 }
    );
  }
};
