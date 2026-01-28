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
  const [selectedVariantIds, setSelectedVariantIds] = useState([]); // Stores full variant GIDs
  const [checkoutUrl, setCheckoutUrl] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Extract numeric variant ID from GID format: gid://shopify/ProductVariant/123456
  const getVariantId = (variantGid) => {
    if (!variantGid) return null;
    const match = variantGid.match(/\/ProductVariant\/(\d+)/);
    return match ? match[1] : null;
  };

  // Toggle selection for a given variant (accepts full GID)
  const toggleVariantSelection = (variantGid) => {
    if (!variantGid) return;

    setSelectedVariantIds((prev) => {
      if (prev.includes(variantGid)) {
        return prev.filter((id) => id !== variantGid);
      }
      return [...prev, variantGid];
    });
    // Reset checkout URL when selection changes
    setCheckoutUrl(null);
  };

  // Checkout selected variants via backend API
  const checkoutSelectedVariants = async () => {
    if (!selectedVariantIds || selectedVariantIds.length === 0) {
      return;
    }

    setCheckoutLoading(true);
    setCheckoutUrl(null);
    setError(null);

    try {
      const shopDomain = getShopDomain();
      
      if (!shopDomain) {
        throw new Error("Shop domain not available");
      }

      console.log("🛒 [EXTENSION] Creating cart with variants:", selectedVariantIds);

      // Call your backend API
      const response = await fetch(`${APP_URL}/api/cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shop: shopDomain,
          lines: selectedVariantIds.map((variantGid) => ({
            variantId: variantGid, // Full GID: gid://shopify/ProductVariant/12345
            quantity: 1,
          })),
          note: "Cross-sell recommendation",
        }),
      });

      console.log("📥 [EXTENSION] Cart API response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to create cart" }));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("✅ [EXTENSION] Cart created:", data);
      
      if (data.checkoutUrl) {
        setCheckoutUrl(data.checkoutUrl);
        console.log("✅ [EXTENSION] Checkout URL received:", data.checkoutUrl);
      } else {
        throw new Error("No checkoutUrl in response");
      }
    } catch (err) {
      console.error("❌ [EXTENSION] Error creating cart:", err);
      setError(err instanceof Error ? err.message : "Failed to create cart");
    } finally {
      setCheckoutLoading(false);
    }
  };

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
                
                // Store full variant GID (not numeric ID) for API call
                const variantGid = selectedVariant?.id || null;
                const isSelected = variantGid ? selectedVariantIds.includes(variantGid) : false;

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
                          {/* Selection checkbox */}
                          {variantGid && (
                            <s-checkbox
                              checked={isSelected}
                              onChange={() => toggleVariantSelection(variantGid)}
                            />
                          )}

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
                            {/* {product.handle && (
                              <s-button
                                href={productUrl}
                                variant="primary"
                                size="small"
                              >
                                Buy Now
                              </s-button>
                            )} */}
                          </s-stack>
                        </s-stack>
                      </s-box>
                  );
                })}

              {/* Checkout footer - visible only when at least one variant is selected */}
              {selectedVariantIds.length > 0 && (
                <s-box padding="base" border="base" borderRadius="base">
                  <s-stack gap="base">
                    <s-stack direction="inline" alignItems="center" justifyContent="space-between">
                      <s-text size="medium" emphasis="strong">
                        Total selected
                      </s-text>
                      <s-text size="medium">
                        {selectedVariantIds.length} item(s)
                      </s-text>
                    </s-stack>
                    
                    {/* Show loading state or redirect button */}
                    {checkoutLoading ? (
                      <s-button variant="primary" size="large" disabled>
                        Creating cart...
                      </s-button>
                    ) : checkoutUrl ? (
                      <s-button
                        variant="primary"
                        size="large"
                        href={checkoutUrl}
                      >
                        Go to Checkout →
                      </s-button>
                    ) : (
                      <s-button
                        variant="primary"
                        size="large"
                        onClick={checkoutSelectedVariants}
                      >
                        Checkout {selectedVariantIds.length} item(s)
                      </s-button>
                    )}
                  </s-stack>
                </s-box>
              )}
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
