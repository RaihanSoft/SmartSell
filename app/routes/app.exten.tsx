import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  return { shop: session.shop };
};

export default function Extenstion(){
    const shopify = useAppBridge();
    const { shop } = useLoaderData<typeof loader>();

    const handleSetupExtension = async () => {
        try {
            // Get shop domain
            const shopDomain = shop.replace('.myshopify.com', '');
            
            // Fetch the checkout profile ID via API
            const response = await fetch('/api/checkout-profile', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            
            let profileId = null;
            if (response.ok) {
                const data = await response.json();
                profileId = data.profileId;
            }
            
            // Construct URL based on the format you provided:
            // https://admin.shopify.com/store/{shop}/settings/checkout/editor/profiles/{profile_id}?page=thank-you
            let checkoutEditorUrl;
            if (profileId) {
                checkoutEditorUrl = `https://admin.shopify.com/store/${shopDomain}/settings/checkout/editor/profiles/${profileId}?page=thank-you&context=apps`;
            } else {
                // Fallback: open checkout settings (user can navigate to thank-you page)
                checkoutEditorUrl = `https://admin.shopify.com/store/${shopDomain}/settings/checkout/editor?page=thank-you&context=apps`;
            }
            
            // Open checkout editor in new tab
            window.open(checkoutEditorUrl, '_blank');
            
            shopify.toast.show("Opening checkout editor for Thank You page...");
        } catch (error) {
            console.error("Error opening checkout editor:", error);
            // Fallback: open checkout settings
            const shopDomain = shop.replace('.myshopify.com', '');
            window.open(`https://admin.shopify.com/store/${shopDomain}/settings/checkout/editor?page=thank-you&context=apps`, '_blank');
            shopify.toast.show("Opening checkout editor...");
        }
    };

    return(
        <s-page heading="Extension">
            <s-section heading="Thank You Page Extension">
                <s-paragraph>
                    Set up your cross-sell extension to show recommended products on the thank you page after purchase.
                </s-paragraph>
                <s-stack direction="block" gap="base">
                    <s-button variant="primary" onClick={handleSetupExtension}>
                        Set Up Thank You Page Extension
                    </s-button>
                    <s-paragraph>
                        Click the button above to open the extension editor where you can configure and customize your thank you page cross-sell extension.
                    </s-paragraph>
                </s-stack>
            </s-section>
        </s-page>
    )
}