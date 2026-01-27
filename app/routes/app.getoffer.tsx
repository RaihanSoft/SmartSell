import { useState } from "react";

export default function GetOffer() {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGetOffer = async () => {
        setLoading(true);
        setError(null);
        setData(null);

        try {
            // Build query parameters
            const params = new URLSearchParams({
                surface: "product_page",
                productIds: "gid://shopify/Product/9188175118587",
            });

            // Call backend via the secure /api proxy route with GET method and query parameters
            const response = await fetch(`/api/campaigns/offers?${params.toString()}`);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Failed to fetch offers");
            }

            setData(result);
        } catch (err) {
            console.error("Error fetching offers:", err);
            setError(err instanceof Error ? err.message : "Failed to fetch offers");
        } finally {
            setLoading(false);
        }
    };

    return (
        <s-page heading="Get Offer">
            <s-section heading="Get Offer">
                <s-paragraph>
                    This is the get offer page.
                </s-paragraph>
                <s-button onClick={handleGetOffer} disabled={loading}>
                    {loading ? "Loading..." : "Get Offer"}
                </s-button>

                {error && (
                    <div style={{ marginTop: "var(--p-space-400)" }}>
                        <s-text tone="critical">{error}</s-text>
                    </div>
                )}

                {data && (
                    <div style={{ marginTop: "var(--p-space-500)" }}>
                        <s-stack direction="block" gap="base">
                            <s-heading>Offers Cart</s-heading>

                            {(() => {
                                // Handle the nested offers structure
                                const campaigns = data.offers && Array.isArray(data.offers) ? data.offers : [];

                                if (campaigns.length > 0) {
                                    return (
                                        <s-stack direction="block" gap="large">
                                            {campaigns.map((campaign: any, campaignIndex: number) => (
                                                <s-box key={campaign.campaignId || campaignIndex} borderRadius="base" borderWidth="base">
                                                    <s-section>
                                                        <s-stack direction="block" gap="base">
                                                            {/* Campaign Header */}
                                                            <s-stack direction="block" gap="small">
                                                                <s-heading>{campaign.campaignName || "Campaign"}</s-heading>
                                                                <div style={{ display: "flex", gap: "var(--p-space-300)", alignItems: "center" }}>
                                                                    <s-text tone="subdued">Priority: {campaign.priority}</s-text>
                                                                    {campaign.campaignId && (
                                                                        <s-text tone="subdued" fontSize="small">
                                                                            ID: {campaign.campaignId.substring(0, 8)}...
                                                                        </s-text>
                                                                    )}
                                                                </div>
                                                            </s-stack>

                                                            {/* Cart Items */}
                                                            {campaign.offers && Array.isArray(campaign.offers) && campaign.offers.length > 0 && (
                                                                <s-stack direction="block" gap="base">
                                                                    {campaign.offers.map((offer: any, offerIndex: number) => {
                                                                        const product = offer.product;
                                                                        const selectedVariant = product?.variants?.find(
                                                                            (v: any) => v.id === offer.selectedVariantId
                                                                        ) || product?.variants?.[0];

                                                                        return (
                                                                            <s-box
                                                                                key={offer.id || offerIndex}
                                                                                borderRadius="base"
                                                                                borderWidth="thin"
                                                                                padding="base"
                                                                                backgroundColor="var(--p-color-bg-surface)"
                                                                            >
                                                                                <div style={{
                                                                                    display: "flex",
                                                                                    gap: "var(--p-space-400)",
                                                                                    alignItems: "flex-start"
                                                                                }}>
                                                                                    {/* Product Image */}
                                                                                    {product?.image?.src && (
                                                                                        <div style={{
                                                                                            width: "80px",
                                                                                            height: "80px",
                                                                                            minWidth: "80px",
                                                                                            borderRadius: "var(--p-border-radius-base)",
                                                                                            overflow: "hidden",
                                                                                            backgroundColor: "var(--p-color-bg-surface-subdued)",
                                                                                        }}>
                                                                                            <img
                                                                                                src={product.image.src}
                                                                                                alt={product.image.alt || product.title || "Product"}
                                                                                                style={{
                                                                                                    width: "100%",
                                                                                                    height: "100%",
                                                                                                    objectFit: "cover"
                                                                                                }}
                                                                                            />
                                                                                        </div>
                                                                                    )}

                                                                                    {/* Product Details */}
                                                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                                                        <s-stack direction="block" gap="small">
                                                                                            {/* Product Title */}
                                                                                            <div>
                                                                                                <s-text fontWeight="semibold">
                                                                                                    {product?.title || "Product"}
                                                                                                </s-text>
                                                                                            </div>

                                                                                            {/* Variant Info */}
                                                                                            {selectedVariant && (
                                                                                                <div>
                                                                                                    <s-text tone="subdued" fontSize="small">
                                                                                                        Variant: {selectedVariant.title}
                                                                                                    </s-text>
                                                                                                </div>
                                                                                            )}

                                                                                            {/* Vendor */}
                                                                                            {product?.vendor && (
                                                                                                <div>
                                                                                                    <s-text tone="subdued" fontSize="small">
                                                                                                        {product.vendor}
                                                                                                    </s-text>
                                                                                                </div>
                                                                                            )}

                                                                                            {/* Price and Availability */}
                                                                                            <div style={{
                                                                                                display: "flex",
                                                                                                gap: "var(--p-space-300)",
                                                                                                alignItems: "center",
                                                                                                flexWrap: "wrap"
                                                                                            }}>
                                                                                                {selectedVariant?.price && (
                                                                                                    <div>
                                                                                                        <s-text fontWeight="semibold">
                                                                                                            ${parseFloat(selectedVariant.price).toFixed(2)}
                                                                                                        </s-text>
                                                                                                    </div>
                                                                                                )}
                                                                                                {selectedVariant?.compareAtPrice && (
                                                                                                    <div>
                                                                                                        <s-text
                                                                                                            tone="subdued"
                                                                                                            fontSize="small"
                                                                                                            style={{ textDecoration: "line-through" }}
                                                                                                        >
                                                                                                            ${parseFloat(selectedVariant.compareAtPrice).toFixed(2)}
                                                                                                        </s-text>
                                                                                                    </div>
                                                                                                )}
                                                                                                <div>
                                                                                                    <s-text
                                                                                                        tone={selectedVariant?.available ? "success" : "critical"}
                                                                                                        fontSize="small"
                                                                                                    >
                                                                                                        {selectedVariant?.available ? "In Stock" : "Out of Stock"}
                                                                                                    </s-text>
                                                                                                </div>
                                                                                            </div>

                                                                                            {/* Offer Type */}
                                                                                            {offer.type && (
                                                                                                <div>
                                                                                                    <s-text tone="info" fontSize="small">
                                                                                                        Offer Type: {offer.type}
                                                                                                    </s-text>
                                                                                                </div>
                                                                                            )}
                                                                                        </s-stack>
                                                                                    </div>
                                                                                </div>
                                                                            </s-box>
                                                                        );
                                                                    })}
                                                                </s-stack>
                                                            )}

                                                            {/* Total Matches Info */}
                                                            {data.totalMatches !== undefined && (
                                                                <div style={{
                                                                    paddingTop: "var(--p-space-300)",
                                                                    borderTop: "1px solid var(--p-color-border-subdued)"
                                                                }}>
                                                                    <s-text tone="subdued">
                                                                        Total Matches: {data.totalMatches}
                                                                    </s-text>
                                                                </div>
                                                            )}
                                                        </s-stack>
                                                    </s-section>
                                                </s-box>
                                            ))}
                                        </s-stack>
                                    );
                                }

                                // Fallback: show raw JSON if structure is unknown
                                return (
                                    <s-box borderRadius="base">
                                        <s-section>
                                            <s-stack direction="block" gap="base">
                                                <s-heading>Response Data:</s-heading>
                                                <pre style={{
                                                    padding: "var(--p-space-400)",
                                                    backgroundColor: "var(--p-color-bg-surface-subdued)",
                                                    borderRadius: "var(--p-border-radius-base)",
                                                    overflow: "auto",
                                                    fontSize: "var(--p-font-size-200)",
                                                    fontFamily: "monospace",
                                                    maxHeight: "400px"
                                                }}>
                                                    {JSON.stringify(data, null, 2)}
                                                </pre>
                                            </s-stack>
                                        </s-section>
                                    </s-box>
                                );
                            })()}
                        </s-stack>
                    </div>
                )}
            </s-section>
        </s-page>
    );
}