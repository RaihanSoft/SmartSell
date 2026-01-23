import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

/**
 * API endpoint to create a web pixel
 * POST /api/webpixel-create
 * Body: { accountID: string }
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { admin } = await authenticate.admin(request);
    
    if (request.method !== "POST") {
      return Response.json(
        { success: false, error: "Method not allowed" },
        { status: 405 }
      );
    }

    const body = await request.json();
    const accountID = body.accountID || "123"; // Default or from request

    // GraphQL mutation to create web pixel
    const mutation = `
      mutation webPixelCreate($webPixel: WebPixelInput!) {
        webPixelCreate(webPixel: $webPixel) {
          userErrors {
            code
            field
            message
          }
          webPixel {
            settings
            id
          }
        }
      }
    `;

    const variables = {
      webPixel: {
        settings: JSON.stringify({ accountID }),
      },
    };

    const response = await admin.graphql(mutation, {
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

    // Check for user errors from mutation
    const userErrors = data?.data?.webPixelCreate?.userErrors || [];
    if (userErrors.length > 0) {
      console.error("User errors:", JSON.stringify(userErrors, null, 2));
      return Response.json(
        {
          success: false,
          error: "User errors",
          userErrors,
          message: userErrors[0]?.message || "Failed to create web pixel",
        },
        { status: 400 }
      );
    }

    const webPixel = data?.data?.webPixelCreate?.webPixel;

    return Response.json({
      success: true,
      webPixel,
      message: "Web pixel created successfully",
    });
  } catch (error) {
    console.error("Error creating web pixel:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to create web pixel",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
