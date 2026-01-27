import '@shopify/ui-extensions/preact';
import { render } from "preact";
import { useEffect, useState } from "preact/hooks";

// Thank you page extension entry point
export default async () => {
  render(<Extension />, document.body);
};

function Extension() {
  // Access checkout/order data from shopify global
  // For thank you page extension, we access line items from shopify.lines
  console.log("🔘 [EXTENSION] Full shopify object:", shopify);
  console.log("🔘 [EXTENSION] Lines:", shopify.lines);
  console.log("🔘 [EXTENSION] Shop:", shopify.shop);
  
  const [loading, setLoading] = useState(false);
  const [offers, setOffers] = useState(null);
  const [error, setError] = useState(null);

  // APP_URL: This is your Shopify App URL (where React Router app is hosted)
  // This should match the "application_url" in shopify.app.toml
  // The extension calls: APP_URL/api/campaigns/offers
  // The route then proxies to: BACKEND_API_URL/campaigns/offers
  // 
  // NOTE: In development, APP_URL and BACKEND_API_URL might be the same
  // In production, they could be different (app on Vercel, backend on separate server)
  const APP_URL = "https://agaricaceous-breana-floggingly.ngrok-free.dev";

  // Extract shop domain from shopify context
  const getShopDomain = () => {
    // Get from shopify.shop.myshopifyDomain (most reliable)
    if (shopify?.shop?.myshopifyDomain) {
      return shopify.shop.myshopifyDomain;
    }
    
    // Fallback to shop.name if myshopifyDomain not available
    if (shopify?.shop?.name) {
      // Try to construct myshopifyDomain from name
      return `${shopify.shop.name}.myshopify.com`;
    }
    
    console.warn("⚠️ [EXTENSION] Could not extract shop domain");
    return null;
  };

  // Extract product IDs from shopify.lines (checkout line items)
  const getProductIds = () => {
    try {
      console.log("🔍 [EXTENSION] shopify.lines type:", typeof shopify.lines);
      console.log("🔍 [EXTENSION] shopify.lines structure:", shopify.lines);
      console.log("🔍 [EXTENSION] shopify.lines.current:", shopify.lines?.current);
      console.log("🔍 [EXTENSION] shopify.lines.v:", shopify.lines?.v);
      
      // shopify.lines is a reactive object, access the value
      // It might be shopify.lines.current or shopify.lines.v or just shopify.lines
      let lines = null;
      
      if (shopify.lines) {
        // Try different ways to access the reactive value
        if (shopify.lines.current) {
          lines = shopify.lines.current;
          console.log("✅ [EXTENSION] Using shopify.lines.current");
        } else if (shopify.lines.v) {
          lines = shopify.lines.v;
          console.log("✅ [EXTENSION] Using shopify.lines.v");
        } else if (Array.isArray(shopify.lines)) {
          lines = shopify.lines;
          console.log("✅ [EXTENSION] Using shopify.lines directly (array)");
        } else if (typeof shopify.lines === 'object' && 'v' in shopify.lines) {
          lines = shopify.lines.v;
          console.log("✅ [EXTENSION] Using shopify.lines.v (from object check)");
        }
      }
      
      console.log("🔘 [EXTENSION] Lines data:", lines);
      console.log("🔘 [EXTENSION] Lines is array?", Array.isArray(lines));
      console.log("🔘 [EXTENSION] Lines length:", lines?.length);
      
      if (!lines || !Array.isArray(lines) || lines.length === 0) {
        console.warn("⚠️ [EXTENSION] No line items found");
        return [];
      }
      
      // Log first line item structure for debugging
      if (lines.length > 0) {
        console.log("🔍 [EXTENSION] First line item:", lines[0]);
        console.log("🔍 [EXTENSION] First line item keys:", Object.keys(lines[0] || {}));
      }
      
      // Extract unique product IDs from line items
      const productIds = lines
        .map((item, index) => {
          console.log(`🔍 [EXTENSION] Processing line item ${index}:`, item);
          
          // Line items can have product ID in different places
          // Try item.product?.id or item.merchandise?.product?.id
          const productId = item.product?.id || 
                          item.merchandise?.product?.id ||
                          item.variant?.product?.id ||
                          item.merchandise?.id; // Sometimes variant ID is in merchandise.id
          
          console.log(`🔍 [EXTENSION] Line item ${index} product ID:`, productId);
          return productId;
        })
        .filter((id) => id != null);
      
      console.log("📦 [EXTENSION] Extracted product IDs:", productIds);
      return [...new Set(productIds)]; // Remove duplicates
    } catch (error) {
      console.error("❌ [EXTENSION] Error extracting product IDs:", error);
      console.error("❌ [EXTENSION] Error stack:", error.stack);
      return [];
    }
  };

  const fetchOffers = async () => {
    console.log("🔘 [EXTENSION] fetchOffers called");
    setLoading(true);
    setError(null);
    setOffers(null);

    try {
      const productIds = getProductIds();
      console.log("📦 [EXTENSION] Product IDs extracted:", productIds);
      
      if (productIds.length === 0) {
        console.log("⚠️ [EXTENSION] No products found in checkout lines");
        setError("No products found in your order. Please try again.");
        setLoading(false);
        return;
      }

      // Call the file-based API route (which will proxy to backend)
      // Flow: Extension → /api/campaigns/offers → Backend
      const apiUrl = `${APP_URL}/api/campaigns/offers`;
      
      // Try to get shop domain
      const shopDomain = getShopDomain();
      
      console.log("📤 [EXTENSION] Calling proxy route:", apiUrl);
      console.log("📦 [EXTENSION] Request data:", {
        surface: "thank-you-page",
        productIds: productIds,
        shop: shopDomain,
      });

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          surface: "product_page",
          productIds: productIds,
          shop: shopDomain, // Include shop domain if available
        }),
      });

      console.log("📥 [EXTENSION] Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to fetch offers" }));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("✅ [EXTENSION] Received offers data:", JSON.stringify(data, null, 2));
      console.log("✅ [EXTENSION] Offers array:", data.offers);
      console.log("✅ [EXTENSION] Offers length:", data.offers?.length);
      if (data.offers && data.offers.length > 0) {
        console.log("✅ [EXTENSION] First campaign:", data.offers[0]);
        console.log("✅ [EXTENSION] First campaign offers:", data.offers[0].offers);
      }
      setOffers(data);
    } catch (err) {
      console.error("Error fetching offers:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch offers");
    } finally {
      setLoading(false);
    }
  };

  // Log offers state changes for debugging
  useEffect(() => {
    console.log("🔄 [EXTENSION] Offers state changed:", offers);
    if (offers) {
      console.log("🔄 [EXTENSION] Offers.offers:", offers.offers);
      console.log("🔄 [EXTENSION] Offers.offers length:", offers.offers?.length);
    }
  }, [offers]);

  // Automatically fetch offers when component mounts
  useEffect(() => {
    console.log("🚀 [EXTENSION] Component mounted, auto-fetching offers...");
    fetchOffers();
  }, []);

  // Render cross-sell UI with offers
  return (
    <s-banner heading="You might also like">
      <s-stack gap="base">
        <s-button 
          onClick={() => {
            console.log("🔄 [EXTENSION] Refresh button clicked");
            fetchOffers();
          }}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </s-button>
        {loading && (
          <s-text>Loading recommended products...</s-text>
        )}
        
        {error && (
          <s-stack gap="base">
            <s-text tone="critical">
              {error}
            </s-text>
            <s-button 
              onClick={() => {
                console.log("🔘 [EXTENSION] Retry button clicked");
                fetchOffers();
              }}
              disabled={loading}
            >
              {loading ? "Loading..." : "Try Again"}
            </s-button>
          </s-stack>
        )}

        {(() => {
          if (!offers || !offers.offers || !Array.isArray(offers.offers) || offers.offers.length === 0) {
            return null;
          }
          
          // Flatten all offers from all campaigns for simpler rendering
          const allOffers = [];
          offers.offers.forEach((campaign) => {
            if (campaign.offers && Array.isArray(campaign.offers)) {
              campaign.offers.forEach((offer) => {
                if (offer && offer.product) {
                  allOffers.push(offer);
                }
              });
            }
          });
          
          console.log("✅ [EXTENSION] Total products to render:", allOffers.length);
          console.log("✅ [EXTENSION] First product:", allOffers[0]?.product);
          
          if (allOffers.length === 0) {
            return (
              <s-text tone="subdued">No products to display</s-text>
            );
          }
          
          return (
            <s-stack gap="base">
              <s-text size="small" tone="subdued">
                Found {allOffers.length} product(s)
              </s-text>
              {allOffers.map((offer, index) => {
                const product = offer.product;
                
                console.log(`🎯 [EXTENSION] Rendering product ${index}:`, product?.title);
                console.log(`🎯 [EXTENSION] Product ${index} data:`, product);
                
                if (!product) {
                  console.warn(`⚠️ [EXTENSION] Offer ${index} has no product`);
                  return null;
                }

                // Get the first variant (since selectedVariantId is null, use first variant)
                const selectedVariant = product?.variants && product.variants.length > 0
                  ? product.variants[0]
                  : null;
                
                // Use variant price if available, otherwise use product minPrice
                const price = selectedVariant?.price || product?.minPrice || "0.00";
                const compareAtPrice = selectedVariant?.compareAtPrice || null;
                
                console.log(`💰 [EXTENSION] Product ${index}: ${product.title}, Price: $${price}, Compare: $${compareAtPrice || 'N/A'}`);
                console.log(`✅ [EXTENSION] Rendering product card for: ${product.title}`);
                
                // Build product URL
                const productUrl = product.handle 
                  ? `/products/${product.handle}` 
                  : `#`;

                return (
                  <s-box
                    key={`product-${index}-${offer.id || product.id || Math.random()}`}
                    borderRadius="base"
                    padding="base"
                    border="base"
                  >
                        <s-stack direction="inline" gap="base" alignItems="start">
                          {/* Product Image */}
                          {product?.image?.src ? (
                            <s-box inlineSize="120px" blockSize="120px" borderRadius="base" overflow="hidden">
                              <s-image
                                src={product.image.src}
                                alt={product.image.alt || product.title || "Product"}
                                aspectRatio="1"
                                inlineSize="100%"
                                blockSize="100%"
                              />
                            </s-box>
                          ) : (
                            <s-box 
                              inlineSize="120px" 
                              blockSize="120px" 
                              borderRadius="base" 
                              background="subdued"
                            >
                              <s-text tone="subdued" size="small">No Image</s-text>
                            </s-box>
                          )}

                          {/* Product Details */}
                          <s-stack direction="block" gap="small" flex="1">
                            {/* Product Name */}
                            <s-text size="large" emphasis="strong">
                              {product?.title || "Product"}
                            </s-text>

                            {/* Vendor */}
                            {product?.vendor && (
                              <s-text size="small" tone="subdued">
                                {product.vendor}
                              </s-text>
                            )}

                            {/* Price */}
                            <s-stack direction="inline" gap="small" alignItems="center">
                              <s-text size="medium" emphasis="strong">
                                ${parseFloat(price).toFixed(2)}
                              </s-text>
                              {compareAtPrice && parseFloat(compareAtPrice) > parseFloat(price) && (
                                <s-text size="small" tone="subdued">
                                  ${parseFloat(compareAtPrice).toFixed(2)}
                                </s-text>
                              )}
                            </s-stack>

                            {/* View Product Link */}
                            {product.handle && (
                              <s-button
                                href={productUrl}
                                variant="primary"
                                size="small"
                              >
                                View Product
                              </s-button>
                            )}
                          </s-stack>
                        </s-stack>
                      </s-box>
                  );
                })}
            </s-stack>
          );
        })()}

        {!loading && !error && (!offers || !offers.offers || offers.offers.length === 0) && (
          <s-stack gap="base">
            <s-text>
              No recommended products available at this time.
            </s-text>
            <s-button 
              onClick={() => {
                console.log("🔘 [EXTENSION] Retry button clicked");
                fetchOffers();
              }}
              disabled={loading}
            >
              {loading ? "Loading..." : "Retry"}
            </s-button>
          </s-stack>
        )}
      </s-stack>
    </s-banner>
  );
}
