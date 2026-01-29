import { useState, useEffect } from "react";
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

type CampaignStep = "dashboard" | "campaign-types" | "campaign-form";
type CampaignType = "list" | "amazon" | "classic" | null;

// Backend base URL: prefer env var, fall back to provided ngrok URL for local dev.
const BACKEND_BASE_URL =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_BACKEND_BASE_URL) ||
  "https://agaricaceous-breana-floggingly.ngrok-free.dev";

// Loader function to automatically create web pixel when user visits dashboard
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  
  // Automatically create web pixel when user visits the dashboard
  try {
    console.log("🎯 Checking/creating web pixel for shop:", session.shop);

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
        settings: JSON.stringify({ accountID: "123" }),
      },
    };

    const response = await admin.graphql(mutation, {
      variables,
    });

    const data: any = await response.json();

    // Check for GraphQL errors
    if (data.errors) {
      console.error("❌ GraphQL errors creating web pixel:", JSON.stringify(data.errors, null, 2));
    } else {
      // Check for user errors
      const userErrors = data?.data?.webPixelCreate?.userErrors || [];
      if (userErrors.length > 0) {
        // Check if web pixel already exists (common error)
        const alreadyExists = userErrors.some(
          (err: any) => 
            err.message?.toLowerCase().includes("already exists") || 
            err.code === "TAKEN" ||
            err.message?.toLowerCase().includes("duplicate")
        );
        if (alreadyExists) {
          console.log("ℹ️ Web pixel already exists for this shop");
        } else {
          console.error("❌ Web pixel creation user errors:", JSON.stringify(userErrors, null, 2));
        }
      } else {
        const webPixel = data?.data?.webPixelCreate?.webPixel;
        console.log("✅ Web pixel created successfully:", webPixel?.id);
      }
    }
  } catch (error) {
    console.error("❌ Error creating web pixel:", error);
    // Don't fail the page load if web pixel creation fails
  }

  return { webPixelCreated: true };
};

export default function Index() {
  const shopify = useAppBridge();
  const [currentStep, setCurrentStep] = useState<CampaignStep>("dashboard");
  const [selectedCampaignType, setSelectedCampaignType] = useState<CampaignType>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEnabling, setIsEnabling] = useState(false);
  const [isAppEmbedEnabled, setIsAppEmbedEnabled] = useState(false);
  const [selectionMethod, setSelectionMethod] = useState<string>("manual");
  const [setEndDate, setSetEndDate] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationResults, setValidationResults] = useState<{
    campaignActive: boolean;
    productsValid: boolean;
    postPurchaseConfigured: boolean;
  } | null>(null);
  const [triggerType, setTriggerType] = useState<string>("");
  const [campaignName, setCampaignName] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Reset modal state when triggerType changes
  useEffect(() => {
    setTriggerModalSelected({});
    setTriggerModalData([]);
    setTriggerModalSearch("");
    setSelectedItems([]);
  }, [triggerType]);
  const [triggerModalSearch, setTriggerModalSearch] = useState<string>("");
  const [triggerModalSelected, setTriggerModalSelected] = useState<Record<string, boolean>>({});
  const [triggerModalData, setTriggerModalData] = useState<any[]>([]);
  const [triggerModalLoading, setTriggerModalLoading] = useState<boolean>(false);
  const [triggerModalError, setTriggerModalError] = useState<string | null>(null);
  const [isTriggerModalOpen, setIsTriggerModalOpen] = useState<boolean>(false);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);

  // Offers (Configurations) modal state
  const [offerType, setOfferType] = useState<"products" | "variants">("products");
  const [offerModalSearch, setOfferModalSearch] = useState<string>("");
  const [offerModalSelected, setOfferModalSelected] = useState<Record<string, boolean>>({});
  const [offerModalData, setOfferModalData] = useState<any[]>([]);
  const [offerModalLoading, setOfferModalLoading] = useState<boolean>(false);
  const [offerModalError, setOfferModalError] = useState<string | null>(null);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState<boolean>(false);
  const [selectedOfferItems, setSelectedOfferItems] = useState<any[]>([]);
  
  // Offers response state
  const [offersResponse, setOffersResponse] = useState<any>(null);
  const [selectedOffers, setSelectedOffers] = useState<Record<string, boolean>>({});

  const openTriggerModal = () => {
    const modal = document.getElementById("trigger-modal") as any;
    if (!modal) return;

    setIsTriggerModalOpen(true);

    // Prefer web-component APIs if present; otherwise fall back to attributes.
    if (typeof modal.show === "function") {
      modal.show();
      return;
    }
    if ("open" in modal) {
      modal.open = true;
      return;
    }
    modal.setAttribute("open", "");
  };

  const openOfferModal = () => {
    const modal = document.getElementById("offer-modal") as any;
    if (!modal) return;

    setIsOfferModalOpen(true);

    if (typeof modal.show === "function") {
      modal.show();
      return;
    }
    if ("open" in modal) {
      modal.open = true;
      return;
    }
    modal.setAttribute("open", "");
  };

  // Fetch data based on triggerType when modal opens or search changes
  useEffect(() => {
    if (!isTriggerModalOpen || !triggerType || triggerType === "all-products") {
      return;
    }

    const fetchData = async () => {
      setTriggerModalLoading(true);
      setTriggerModalError(null);

      try {
        let apiUrl = "";
        const searchParam = triggerModalSearch.trim() ? `&query=${encodeURIComponent(triggerModalSearch.trim())}` : "";

        if (triggerType === "specific-products") {
          apiUrl = `/api/products-search${searchParam}`;
        } else if (triggerType === "tags") {
          apiUrl = `/api/tags${searchParam}`;
        } else if (triggerType === "collections") {
          apiUrl = `/api/collections${searchParam}`;
        } else {
          setTriggerModalLoading(false);
          return;
        }

        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || "Failed to fetch data");
        }

        // Transform data to common format
        if (triggerType === "specific-products") {
          setTriggerModalData(data.products || []);
        } else if (triggerType === "tags") {
          setTriggerModalData(data.tags || []);
        } else if (triggerType === "collections") {
          setTriggerModalData(data.collections || []);
        }
      } catch (error) {
        console.error("Error fetching modal data:", error);
        setTriggerModalError(error instanceof Error ? error.message : "Failed to fetch data");
        setTriggerModalData([]);
      } finally {
        setTriggerModalLoading(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(fetchData, 300);
    return () => clearTimeout(timeoutId);
  }, [isTriggerModalOpen, triggerType, triggerModalSearch]);

  // Fetch data for offers modal based on offerType
  useEffect(() => {
    if (!isOfferModalOpen) return;

    const fetchData = async () => {
      setOfferModalLoading(true);
      setOfferModalError(null);

      try {
        const searchParam = offerModalSearch.trim()
          ? `?query=${encodeURIComponent(offerModalSearch.trim())}`
          : "";

        let apiUrl = "";
        if (offerType === "products") {
          apiUrl = `/api/products-search${searchParam}`;
        } else if (offerType === "variants") {
          apiUrl = `/api/variants${searchParam}`;
        }

        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || "Failed to fetch offers data");
        }

        if (offerType === "products") {
          setOfferModalData(data.products || []);
        } else if (offerType === "variants") {
          setOfferModalData(data.variants || []);
        }
      } catch (error) {
        console.error("Error fetching offers modal data:", error);
        setOfferModalError(error instanceof Error ? error.message : "Failed to fetch data");
        setOfferModalData([]);
      } finally {
        setOfferModalLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchData, 300);
    return () => clearTimeout(timeoutId);
  }, [isOfferModalOpen, offerType, offerModalSearch]);

  // Same-page navigation: multi-step flow (follows .cursorrules for performance)
  const goToCampaignTypes = () => {
    setCurrentStep("campaign-types");
  };

  const goToCampaignForm = (type: CampaignType) => {
    setSelectedCampaignType(type);
    setCurrentStep("campaign-form");
  };

  const goBack = () => {
    if (currentStep === "campaign-form") {
      setCurrentStep("campaign-types");
      setSelectedCampaignType(null);
    } else if (currentStep === "campaign-types") {
      setCurrentStep("dashboard");
    }
  };

  // Send core campaign data to backend ingest endpoint
  const sendCampaignToBackend = async () => {
    if (!campaignName.trim()) {
      shopify.toast?.show?.("Please enter a campaign name before saving.", {
        isError: true,
      });
      return;
    }

    if (!BACKEND_BASE_URL) {
      shopify.toast?.show?.("Backend URL is not configured.", { isError: true });
      return;
    }

    // Collect all form data
    const form = document.querySelector('form[data-save-bar]') as HTMLFormElement;
    const formData = form ? new FormData(form) : null;

    // Map trigger type to backend format
    const mapTriggerType = (type: string): string => {
      if (type === "all-products") return "all_products";
      if (type === "specific-products") return "specific_products";
      if (type === "tags") return "tags";
      if (type === "collections") return "collections";
      return "all_products";
    };

    // Map offer type to backend format
    const mapOfferType = (type: string): string => {
      if (type === "variants") return "specific_variants";
      return "specific_products";
    };

    // Convert date and time to ISO format
    const formatDateTime = (date: string, time: string): string | null => {
      if (!date) return null;
      try {
        // Parse date (assuming format like "2026-01-16")
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) return null;
        
        // Parse time (assuming format like "12:37 AM" or "12:37:00")
        let hours = 0, minutes = 0;
        if (time) {
          const timeMatch = time.match(/(\d+):(\d+)/);
          if (timeMatch) {
            hours = parseInt(timeMatch[1]);
            minutes = parseInt(timeMatch[2]);
            // Handle AM/PM
            if (time.toLowerCase().includes("pm") && hours !== 12) hours += 12;
            if (time.toLowerCase().includes("am") && hours === 12) hours = 0;
          }
        }
        
        dateObj.setHours(hours, minutes, 0, 0);
        return dateObj.toISOString();
      } catch {
        return null;
      }
    };

    // Extract GIDs from items (items already contain id field)
    const extractGIDs = (items: any[]): string[] => {
      return items.map((item) => item.id || "").filter((id) => id);
    };

    const startDate = formData?.get("startDate")?.toString() || "";
    const startTime = formData?.get("startTime")?.toString() || "";
    const endDate = formData?.get("endDate")?.toString() || "";
    const endTime = formData?.get("endTime")?.toString() || "";

    const startsAt = formatDateTime(startDate, startTime) || new Date().toISOString();
    const endsAtValue = setEndDate && endDate ? formatDateTime(endDate, endTime) : null;

    const payload: {
      name: string;
      description: string;
      surface: string;
      priority: number;
      offersMode: string;
      triggerConditions: { type: string; items: string[] };
      offerSelection: { type: string; items: string[] };
      startsAt: string;
      endsAt?: string;
      status: string;
    } = {
      name: campaignName.trim(),
      description: formData?.get("campaignSubtitle")?.toString() || "",
      surface: "product_page",
      priority: formData?.get("campaignPriority") ? parseInt(formData.get("campaignPriority") as string) || 10 : 10,
      offersMode: selectionMethod || "manual",
      triggerConditions: {
        type: mapTriggerType(triggerType || "all-products"),
        items: extractGIDs(selectedItems),
      },
      offerSelection: {
        type: mapOfferType(offerType),
        items: extractGIDs(selectedOfferItems),
      },
      startsAt,
      status: "active",
    };

    // Only include endsAt if it's set and valid
    if (endsAtValue) {
      payload.endsAt = endsAtValue;
    }

    try {
      setIsSaving(true);
      
      // Get session token from server (App Bridge automatically adds it to fetch requests to same domain)
      const tokenResponse = await fetch("/api/get-token", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!tokenResponse.ok) {
        throw new Error("Failed to get session token");
      }

      const tokenData = await tokenResponse.json();
      const sessionToken = tokenData.token;

      if (!sessionToken) {
        throw new Error("Session token not available");
      }
      
      const response = await fetch(`${BACKEND_BASE_URL}/api/campaigns`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionToken}`,
        
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Backend responded with ${response.status}`);
      }

      const responseData = await response.json();
      console.log("📦 [OFFERS] Response data:", responseData);
      console.log("📦 [OFFERS] Offers array:", responseData?.offers);
      setOffersResponse(responseData);
      shopify.toast?.show?.("Campaign data sent to backend successfully.");
    } catch (error) {
      console.error("Error sending campaign to backend:", error);
      shopify.toast?.show?.("Failed to send campaign data to backend.", {
        isError: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle save campaign - send to backend and show validation modal
  const handleSaveCampaign = async () => {
    await sendCampaignToBackend();

    setIsValidating(true);
    setValidationResults(null);

    // Simulate validation process
    setTimeout(() => {
      // Perform validation checks
      const results = {
        campaignActive: true, // Campaign is active
        productsValid: true, // Products are valid
        postPurchaseConfigured: false, // Post-purchase not configured
      };

      setIsValidating(false);
      setValidationResults(results);
    }, 2000); // 2 second delay to show loading state
  };

  // Handle refresh action with loading state (follows .cursorrules)
  // Example: Using App Bridge session token to call backend API
  const handleRefresh = async () => {
    if (isRefreshing) return; // Prevent multiple clicks

    setIsRefreshing(true);

    try {
      // Example: Call backend API with App Bridge session token
      // App Bridge automatically adds authorization header to fetch requests
      const response = await fetch("/api/campaigns/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // App Bridge automatically includes: authorization: Bearer <session_token>
      });

      if (!response.ok) {
        throw new Error("Failed to refresh");
      }

      const data = await response.json();

      // Show success toast (Polaris pattern)
      shopify.toast.show("App embed refreshed successfully");
    } catch (error) {
      console.error("Refresh error:", error);
      shopify.toast.show("Failed to refresh", { isError: true });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle enable web pixel action
  const handleEnable = async () => {
    if (isEnabling || isAppEmbedEnabled) return; // Prevent multiple clicks or if already enabled

    setIsEnabling(true);

    try {
      // Enable the app embed
      const response = await fetch("/api/webpixel-create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountID: "123", // You can make this dynamic or get from config
        }),
        // App Bridge automatically includes: authorization: Bearer <session_token>
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to enable web pixel");
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to enable web pixel");
      }

      setIsAppEmbedEnabled(true);
      shopify.toast?.show?.("App embed enabled successfully");
    } catch (error) {
      console.error("Enable error:", error);
      shopify.toast?.show?.(
        error instanceof Error ? error.message : "Failed to enable web pixel",
        { isError: true }
      );
    } finally {
      setIsEnabling(false);
    }
  };

  return (
    <s-page>
      {/* Persistent Header Bar - Changes content based on step (follows .cursorrules) */}
      <s-stack direction="inline" paddingBlockEnd="base" alignItems="center" justifyContent="space-between">
        {/* Left side: Title/Back navigation */}
        {currentStep === "dashboard" && (
          <s-heading> <span style={{ fontSize: "20px" }} >Dashboard</span> </s-heading>
        )}
        {currentStep === "campaign-types" && (
          <s-stack direction="inline" gap="none" alignItems="center">
            <s-button variant="tertiary" onClick={goBack}>
              ←
            </s-button>

            <s-heading> <span style={{ fontSize: "20px" }} >Create campaign</span> </s-heading>
          </s-stack>
        )}
        {currentStep === "campaign-form" && (
          <s-stack direction="inline" gap="none" alignItems="center">
            <s-button variant="tertiary" onClick={goBack}>
              ←
            </s-button>
            <s-heading>
              <span style={{ fontSize: "20px" }} >Frequently bought together</span>
              ({selectedCampaignType === "list" ? "List" : selectedCampaignType === "amazon" ? "Amazon" : "Classic"})
            </s-heading>
          </s-stack>
        )}

        {/* Right side: Action buttons */}
        {currentStep === "dashboard" && (
          <s-button
            variant="primary"
            onClick={goToCampaignTypes}
          >
            Create Campaign
          </s-button>
        )}
        {currentStep === "campaign-form" && (
          <s-button variant="tertiary">Test in store</s-button>
        )}
      </s-stack>

      {/* Step 1: Campaign Type Selection - Same Page (follows .cursorrules) */}
      {currentStep === "campaign-types" && (

        <s-stack gap="base">
          <s-stack direction="inline" gap="small">
            <s-button variant="secondary">Placement: All (18)</s-button>
            <s-button variant="secondary">More filters: All</s-button>
          </s-stack>

          {/* Product page heading with top spacing using s-stack gap */}
          <s-heading>Product page</s-heading>






          {/* Campaign Type Cards Grid - Uses Polaris s-grid for proper alignment (follows .cursorrules) */}
          <s-grid gridTemplateColumns="1fr 1fr 1fr" gap="base">
            {/* Frequently bought together (List) */}
            <s-grid-item>
              <s-box borderRadius="base">
                <s-section>
                  <s-stack direction="block" gap="base">
                    <s-image
                      src="https://i.ibb.co.com/hFQ6875b/widget-bl.png"
                      alt="Frequently bought together (List) preview"
                      aspectRatio="59/161"
                      inlineSize="auto"
                    />
                    <s-heading>Frequently bought together (List)</s-heading>
                    <s-paragraph>
                      A pre-selected bundle in list format an alternative to single product purchase
                    </s-paragraph>
                    <s-stack justifyContent="end" direction="inline" gap="base">
                      <s-button variant="tertiary">Preview</s-button>
                      <s-button variant="primary" onClick={() => goToCampaignForm("list")}>
                        Create
                      </s-button>
                    </s-stack>
                  </s-stack>

                </s-section>
              </s-box>
            </s-grid-item>

            {/* Frequently bought together (Amazon) */}
            <s-grid-item>
              <s-box borderRadius="base">
                < s-section>
                  <s-stack direction="block" gap="base">
                    <s-image
                      src="https://i.ibb.co.com/hFQ6875b/widget-bl.png"
                      alt="Frequently bought together (Amazon) preview"
                      aspectRatio="59/161"
                      inlineSize="auto"
                    />
                    <s-heading>Frequently bought together (Amazon)</s-heading>
                    <s-paragraph>
                      A pre-selected bundle in Amazon style an alternative to single product purchase
                    </s-paragraph>
                    <s-stack justifyContent="end" direction="inline" gap="base">
                      <s-button variant="tertiary">Preview</s-button>
                      <s-button variant="primary" onClick={() => goToCampaignForm("amazon")}>
                        Create
                      </s-button>
                    </s-stack>
                  </s-stack>
                </s-section>
              </s-box>
            </s-grid-item>

            {/* Frequently bought together (Classic) */}
            <s-grid-item>
              <s-box borderRadius="base">
                <s-section>
                  <s-stack direction="block" gap="base">
                    <s-image
                      src="https://i.ibb.co.com/hFQ6875b/widget-bl.png"
                      alt="Frequently bought together (Classic) preview"
                      aspectRatio="59/161"
                      inlineSize="auto"
                    />
                    <s-heading>Frequently bought together (Classic)</s-heading>
                    <s-paragraph>
                      A pre-selected bundle in classic style an alternative to single product purchase
                    </s-paragraph>
                    <s-stack justifyContent="end" direction="inline" gap="base">
                      <s-button variant="tertiary">Preview</s-button>
                      <s-button variant="primary" onClick={() => goToCampaignForm("classic")}>
                        Create
                      </s-button>
                    </s-stack>
                  </s-stack>
                </s-section>
              </s-box>
            </s-grid-item>
          </s-grid>






        </s-stack>




      )}

      {/* Step 2: Campaign Form - Same Page (follows .cursorrules) */}
      {currentStep === "campaign-form" && (
        <s-stack>
          {/* Campaign Form */}
          <form data-save-bar>
            <s-stack direction="block" gap="base">
              {/* Campaign name */}
              <s-section >
                <s-heading>Campaign name - for internal reference</s-heading>
                <s-text-field
                  name="campaignName"
                  value={campaignName}
                  placeholder="Required. Eg: Frequently bought together campaign for t-shirts"
                  required
                  onInput={(e) => setCampaignName(e.currentTarget.value || "")}
                />
              </s-section>


              {/* Trigger */}
              <s-section>
                <s-heading>Trigger</s-heading>
                <s-paragraph>
                  Select the products for which the offer is displayed on the product page.
                </s-paragraph>

                <s-stack direction="block" gap="base">
                  <s-stack direction="inline" gap="base" alignItems="end">
                    <s-box inlineSize="410px">
                      <s-select
                        name="triggerType"
                        placeholder="Select type"
                        label="Type"
                        value={triggerType}
                        onChange={(e) => setTriggerType(e.currentTarget.value || "")}
                      >
                        <s-option value="all-products">All Products</s-option>
                        <s-option value="specific-products">Specific Products</s-option>
                        <s-option value="tags">Tags</s-option>
                        <s-option value="collections">Collections</s-option>

                      </s-select>
                    </s-box>

                    <s-box inlineSize="422px">
                      <s-text-field
                        name="collection"
                        label={
                          triggerType === "specific-products"
                            ? "Products"
                            : triggerType === "tags"
                              ? "Tags"
                              : "Collection"
                        }
                        placeholder={
                          triggerType === "specific-products"
                            ? "Enter products"
                            : triggerType === "tags"
                              ? "Enter tags"
                              : "Enter collection"
                        }
                        disabled={triggerType === "all-products"}
                        onFocus={() => {
                          if (triggerType !== "all-products") openTriggerModal();
                        }}
                        onInput={(e) => {
                          if (triggerType === "all-products") return;
                          setTriggerModalSearch(e.currentTarget.value || "");
                          openTriggerModal();
                        }}
                      />
                    </s-box>

                    <s-button
                      variant="secondary"
                      commandFor="trigger-modal"
                      disabled={triggerType === "all-products"}
                      onClick={() => {
                        if (triggerType !== "all-products") {
                          openTriggerModal();
                        }
                      }}
                    >
                      Browse
                    </s-button>
                  </s-stack>

                  {/* Selected items list */}
                  {selectedItems.length > 0 && (
                    <s-stack direction="block" gap="small" paddingBlockStart="base">
                      {selectedItems.map((item: any) => (
                        <div
                          key={item.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "var(--p-space-400)",
                            padding: "var(--p-space-300)",
                            backgroundColor: "var(--p-color-bg-surface-secondary)",
                            borderRadius: "var(--p-border-radius-base)",
                          }}
                        >
                          {item.image && (
                            <div style={{ width: "48px", height: "48px", borderRadius: "var(--p-border-radius-base)", overflow: "hidden", flexShrink: 0 }}>
                              <img
                                src={item.image}
                                alt={item.imageAlt || item.title}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            </div>
                          )}
                          <div style={{ flex: 1 }}>
                            <s-text>{item.title}</s-text>
                          </div>
                          <s-stack direction="inline" gap="small" alignItems="center">
                            {/* View button */}
                            {triggerType !== "tags" && (
                              <s-button
                                variant="tertiary"
                                onClick={() => {
                                  const shopDomain = window.location.search.match(/shop=([^&]+)/)?.[1] || "";
                                  if (shopDomain && item.id) {
                                    const idParts = item.id.split("/");
                                    const resourceId = idParts[idParts.length - 1];

                                    if (triggerType === "specific-products") {
                                      window.open(`https://${shopDomain}/admin/products/${resourceId}`, "_blank");
                                    } else if (triggerType === "collections") {
                                      window.open(`https://${shopDomain}/admin/collections/${resourceId}`, "_blank");
                                    }
                                  }
                                }}
                              >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M8 3C5.5 3 3.5 5 3.5 8C3.5 11 5.5 13 8 13C10.5 13 12.5 11 12.5 8C12.5 5 10.5 3 8 3ZM8 11.5C6.6 11.5 5.5 10.4 5.5 9C5.5 7.6 6.6 6.5 8 6.5C9.4 6.5 10.5 7.6 10.5 9C10.5 10.4 9.4 11.5 8 11.5Z" fill="currentColor" />
                                  <path d="M8 7.5C7.4 7.5 7 7.9 7 8.5C7 9.1 7.4 9.5 8 9.5C8.6 9.5 9 9.1 9 8.5C9 7.9 8.6 7.5 8 7.5Z" fill="currentColor" />
                                </svg>
                              </s-button>
                            )}
                            {/* Remove button */}
                            <s-button
                              variant="tertiary"
                              onClick={() => {
                                setSelectedItems((prev) => {
                                  const updated = prev.filter((i) => i.id !== item.id);
                                  const remainingTitles = updated.map((i) => i.title).join(", ");
                                  const textField = document.querySelector('input[name="collection"]') as HTMLInputElement;
                                  if (textField) {
                                    textField.value = remainingTitles;
                                  }
                                  return updated;
                                });
                              }}
                            >
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </s-button>
                          </s-stack>
                        </div>
                      ))}
                    </s-stack>
                  )}

                  <s-stack direction="inline" gap="base" alignItems="center" justifyContent="space-between">
                    <s-button variant="secondary">Add condition</s-button>
                    <s-link href="#">View guide</s-link>
                  </s-stack>
                </s-stack>

                {/* Trigger browse/search modal */}
                <s-modal
                  id="trigger-modal"
                  heading={
                    triggerType === "specific-products"
                      ? "Add products"
                      : triggerType === "tags"
                        ? "Add tags"
                        : "Add collections"
                  }
                >
                  <s-stack direction="block" gap="base">
                    <s-text-field
                      name="triggerModalSearch"
                      label=""
                      placeholder="Search"
                      value={triggerModalSearch}
                      onInput={(e) => setTriggerModalSearch(e.currentTarget.value || "")}
                    />

                    {/* Loading state */}
                    {triggerModalLoading && (
                      <s-stack direction="block" gap="base" alignItems="center" paddingBlock="large">
                        <s-spinner size="large" />
                        <s-text>Loading...</s-text>
                      </s-stack>
                    )}

                    {/* Error state */}
                    {!triggerModalLoading && triggerModalError && (
                      <s-stack direction="block" gap="base" paddingBlock="base">
                        <s-text tone="critical">{triggerModalError}</s-text>
                      </s-stack>
                    )}

                    {/* Data list */}
                    {!triggerModalLoading && !triggerModalError && (
                      <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                        <s-stack direction="block" gap="small">
                          {triggerModalData.length === 0 ? (
                            <s-text>No results found</s-text>
                          ) : (
                            triggerModalData.map((item: any) => {
                              const itemId = item.id || item.name || item.title;
                              const itemTitle = item.title || item.name || "";
                              const itemImage = item.image || null;
                              const itemImageAlt = item.imageAlt || itemTitle;

                              // Get count text based on type
                              let countText = "";
                              if (triggerType === "collections") {
                                countText = item.productsCount !== undefined ? `${item.productsCount} products` : "";
                              } else if (triggerType === "specific-products") {
                                countText = ""; // Products don't need count
                              } else if (triggerType === "tags") {
                                countText = ""; // Tags don't need count
                              }

                              return (
                                <s-stack key={itemId} direction="inline" gap="base" alignItems="center">
                                  {itemImage && (
                                    <div style={{ width: "40px", height: "40px", borderRadius: "var(--p-border-radius-base)", overflow: "hidden", flexShrink: 0 }}>
                                      <img
                                        src={itemImage}
                                        alt={itemImageAlt}
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                      />
                                    </div>
                                  )}
                                  <s-checkbox
                                    name={itemId}
                                    label={countText ? `${itemTitle} — ${countText}` : itemTitle}
                                    checked={Boolean(triggerModalSelected[itemId])}
                                    onChange={() => {
                                      // Toggle the checked state
                                      setTriggerModalSelected((prev) => ({
                                        ...prev,
                                        [itemId]: !prev[itemId],
                                      }));
                                    }}
                                  />
                                </s-stack>
                              );
                            })
                          )}
                        </s-stack>
                      </div>
                    )}

                    {/* Footer actions */}
                    <s-stack direction="inline" gap="base" alignItems="center" justifyContent="space-between">
                      <s-text>
                        {Object.values(triggerModalSelected).filter(Boolean).length}/50{" "}
                        {triggerType === "specific-products"
                          ? "products"
                          : triggerType === "tags"
                            ? "tags"
                            : "collections"}{" "}
                        selected
                      </s-text>
                      <s-stack direction="inline" gap="base">
                        <s-button
                          variant="secondary"
                          onClick={() => {
                            setIsTriggerModalOpen(false);
                            const modal = document.getElementById("trigger-modal") as any;
                            if (modal && typeof modal.hide === "function") {
                              modal.hide();
                            } else if (modal && "open" in modal) {
                              modal.open = false;
                            } else if (modal) {
                              modal.removeAttribute("open");
                            }
                          }}
                        >
                          Cancel
                        </s-button>
                        <s-button
                          variant="primary"
                          disabled={Object.values(triggerModalSelected).filter(Boolean).length === 0}
                          onClick={() => {
                            // Get newly selected items from modal
                            const newlySelectedItems = triggerModalData
                              .filter((item: any) => {
                                const itemId = item.id || item.name || item.title;
                                return triggerModalSelected[itemId];
                              })
                              .map((item: any) => ({
                                id: item.id || item.name || item.title,
                                title: item.title || item.name || "",
                                image: item.image || null,
                                imageAlt: item.imageAlt || item.title || item.name || "",
                                handle: item.handle || null,
                              }));

                            // Add to existing selected items (avoid duplicates)
                            setSelectedItems((prev) => {
                              const existingIds = new Set(prev.map((item) => item.id));
                              const newItems = newlySelectedItems.filter(
                                (item) => !existingIds.has(item.id)
                              );
                              const updated = [...prev, ...newItems];

                              // Update the text field with selected items
                              const allSelectedTitles = updated.map((item) => item.title).join(", ");
                              const textField = document.querySelector('input[name="collection"]') as HTMLInputElement;
                              if (textField) {
                                textField.value = allSelectedTitles;
                              }

                              return updated;
                            });

                            // Clear modal selections
                            setTriggerModalSelected({});

                            // Close modal
                            setIsTriggerModalOpen(false);
                            const modal = document.getElementById("trigger-modal") as any;
                            if (modal && typeof modal.hide === "function") {
                              modal.hide();
                            } else if (modal && "open" in modal) {
                              modal.open = false;
                            } else if (modal) {
                              modal.removeAttribute("open");
                            }
                          }}
                        >
                          Add
                        </s-button>
                      </s-stack>
                    </s-stack>
                  </s-stack>
                </s-modal>

              </s-section>
              {/* offer ......................................................................... */}
              {/* Offers */}
              <s-section>
                <s-heading>Offers</s-heading>
                <s-paragraph>
                  The selected products will be offered as a bundle along with the trigger product.
                </s-paragraph>

                <s-stack direction="block" gap="base">
                  <s-heading>Selection Method</s-heading>
                  <s-stack direction="block" gap="small">
                    <s-checkbox
                      name="selectionMethod"
                      value="manual"
                      label="Manual selection"
                      checked={selectionMethod === "manual"}
                      onChange={(e) => {
                        if (e.currentTarget.checked) {
                          setSelectionMethod("manual");
                        }
                      }}
                    />
                    <s-stack direction="inline" gap="small" alignItems="center">
                      <s-checkbox
                        name="selectionMethod"
                        value="basic-ai"
                        disabled
                        label="Basic AI"
                        checked={selectionMethod === "basic-ai"}
                        onChange={(e) => {
                          if (e.currentTarget.checked) {
                            setSelectionMethod("basic-ai");
                          }
                        }}

                      />
                      <s-badge tone="info">Comming Soon.</s-badge>
                    </s-stack>

                    <s-stack direction="inline" gap="small" alignItems="center">
                      <s-checkbox
                        name="selectionMethod"
                        value="chatgpt-ai"
                        disabled
                        label="ChatGPT powered Selleasy AI"
                        checked={selectionMethod === "chatgpt-ai"}
                        onChange={(e) => {
                          if (e.currentTarget.checked) {
                            setSelectionMethod("chatgpt-ai");
                          }
                        }}
                      />
                      <s-badge tone="info">Comming Soon.</s-badge>
                    </s-stack>
                  </s-stack>

                  <s-heading>Configurations</s-heading>

                  <s-stack direction="inline" gap="base" alignItems="end">
                    <s-box inlineSize="410px">
                      <s-select
                        name="offerType"
                      placeholder="Specific products"
                        label="Type"
                      value={offerType}
                      onChange={(e) => {
                        const value = e.currentTarget.value === "Variants" ? "variants" : "products";
                        setOfferType(value);
                        setOfferModalSelected({});
                        setOfferModalData([]);
                        setSelectedOfferItems([]);
                      }}
                      >
                        <s-option disabled value="Tigger">Tigger Type</s-option>
                      <s-option value="Products">Specific Products</s-option>
                      <s-option value="Variants">Specific Variants</s-option>
                      </s-select>
                    </s-box>

                    <s-box inlineSize="422px">
                      <s-text-field
                        name="products"
                        label={offerType === "variants" ? "Variants" : "Products"}
                        placeholder={offerType === "variants" ? "Select variants" : "Shorts + Shoes"}
                        onFocus={() => openOfferModal()}
                        onInput={(e) => {
                          setOfferModalSearch(e.currentTarget.value || "");
                          openOfferModal();
                        }}
                      />
                    </s-box>

                    <s-button
                      variant="secondary"
                      commandFor="offer-modal"
                      onClick={() => openOfferModal()}
                    >
                      Browse
                    </s-button>
                  </s-stack>
                  
                  {/* Selected offers list */}
                  {selectedOfferItems.length > 0 && (
                    <s-stack direction="block" gap="small" paddingBlockStart="base">
                      {selectedOfferItems.map((item: any) => (
                        <div
                          key={item.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "var(--p-space-400)",
                            padding: "var(--p-space-300)",
                            backgroundColor: "var(--p-color-bg-surface-secondary)",
                            borderRadius: "var(--p-border-radius-base)",
                          }}
                        >
                          {item.image && (
                            <div
                              style={{
                                width: "48px",
                                height: "48px",
                                borderRadius: "var(--p-border-radius-base)",
                                overflow: "hidden",
                                flexShrink: 0,
                              }}
                            >
                              <img
                                src={item.image}
                                alt={item.imageAlt || item.title}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            </div>
                          )}
                          <div style={{ flex: 1 }}>
                            <s-text>{item.title}</s-text>
                            {item.productTitle && offerType === "variants" && (
                              <s-text>{item.productTitle}</s-text>
                            )}
                          </div>
                          <s-stack direction="inline" gap="small" alignItems="center">
                            {/* Remove button */}
                            <s-button
                              variant="tertiary"
                              onClick={() => {
                                setSelectedOfferItems((prev) => {
                                  const updated = prev.filter((i) => i.id !== item.id);
                                  const remainingTitles = updated.map((i) => i.title).join(", ");
                                  const textField = document.querySelector(
                                    'input[name="products"]',
                                  ) as HTMLInputElement;
                                  if (textField) {
                                    textField.value = remainingTitles;
                                  }
                                  return updated;
                                });
                              }}
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M12 4L4 12M4 4L12 12"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </s-button>
                          </s-stack>
                        </div>
                      ))}
                    </s-stack>
                  )}
                </s-stack>
              </s-section>

              {/* Offers modal for configurations */}
              <s-modal
                id="offer-modal"
                heading={offerType === "variants" ? "Add variants" : "Add products"}
              >
                <s-stack direction="block" gap="base">
                  <s-text-field
                    name="offerModalSearch"
                    label=""
                    placeholder="Search"
                    value={offerModalSearch}
                    onInput={(e) => setOfferModalSearch(e.currentTarget.value || "")}
                  />

                  {/* Loading state */}
                  {offerModalLoading && (
                    <s-stack
                      direction="block"
                      gap="base"
                      alignItems="center"
                      paddingBlock="large"
                    >
                      <s-spinner size="large" />
                      <s-text>Loading...</s-text>
                    </s-stack>
                  )}

                  {/* Error state */}
                  {!offerModalLoading && offerModalError && (
                    <s-stack direction="block" gap="base" paddingBlock="base">
                      <s-text tone="critical">{offerModalError}</s-text>
                    </s-stack>
                  )}

                  {/* Data list */}
                  {!offerModalLoading && !offerModalError && (
                    <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                      <s-stack direction="block" gap="small">
                        {offerModalData.length === 0 ? (
                          <s-text>No results found</s-text>
                        ) : (
                          offerModalData.map((item: any) => {
                            const itemId = item.id;
                            const itemTitle = item.title || "";
                            const itemImage = item.image || null;
                            const itemImageAlt = item.imageAlt || itemTitle;

                            return (
                              <s-stack
                                key={itemId}
                                direction="inline"
                                gap="base"
                                alignItems="center"
                              >
                                {itemImage && (
                                  <div
                                    style={{
                                      width: "40px",
                                      height: "40px",
                                      borderRadius: "var(--p-border-radius-base)",
                                      overflow: "hidden",
                                      flexShrink: 0,
                                    }}
                                  >
                                    <img
                                      src={itemImage}
                                      alt={itemImageAlt}
                                      style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                      }}
                                    />
                                  </div>
                                )}
                                <s-checkbox
                                  name={itemId}
                                  label={
                                    offerType === "variants" && item.productTitle
                                      ? `${itemTitle} — ${item.productTitle}`
                                      : itemTitle
                                  }
                                  checked={Boolean(offerModalSelected[itemId])}
                                  onChange={() => {
                                    setOfferModalSelected((prev) => ({
                                      ...prev,
                                      [itemId]: !prev[itemId],
                                    }));
                                  }}
                                />
                              </s-stack>
                            );
                          })
                        )}
                      </s-stack>
                    </div>
                  )}

                  {/* Footer actions */}
                  <s-stack
                    direction="inline"
                    gap="base"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <s-text>
                      {Object.values(offerModalSelected).filter(Boolean).length}/50{" "}
                      {offerType === "variants" ? "variants" : "products"} selected
                    </s-text>
                    <s-stack direction="inline" gap="base">
                      <s-button
                        variant="secondary"
                        onClick={() => {
                          setIsOfferModalOpen(false);
                          setOfferModalSelected({});
                          const modal = document.getElementById("offer-modal") as any;
                          if (modal && typeof modal.hide === "function") {
                            modal.hide();
                          } else if (modal && "open" in modal) {
                            modal.open = false;
                          } else if (modal) {
                            modal.removeAttribute("open");
                          }
                        }}
                      >
                        Cancel
                      </s-button>
                      <s-button
                        variant="primary"
                        disabled={
                          Object.values(offerModalSelected).filter(Boolean).length === 0
                        }
                        onClick={() => {
                          const newlySelected = offerModalData
                            .filter((item: any) => offerModalSelected[item.id])
                            .map((item: any) => ({
                              id: item.id,
                              title: item.title || "",
                              image: item.image || null,
                              imageAlt: item.imageAlt || item.title || "",
                              productTitle: item.productTitle || "",
                            }));

                          setSelectedOfferItems((prev) => {
                            const existingIds = new Set(prev.map((i) => i.id));
                            const merged = [
                              ...prev,
                              ...newlySelected.filter((i) => !existingIds.has(i.id)),
                            ];
                            const titles = merged.map((i) => i.title).join(", ");
                            const textField = document.querySelector(
                              'input[name="products"]',
                            ) as HTMLInputElement;
                            if (textField) {
                              textField.value = titles;
                            }
                            return merged;
                          });

                          setOfferModalSelected({});
                          setIsOfferModalOpen(false);
                          const modal = document.getElementById("offer-modal") as any;
                          if (modal && typeof modal.hide === "function") {
                            modal.hide();
                          } else if (modal && "open" in modal) {
                            modal.open = false;
                          } else if (modal) {
                            modal.removeAttribute("open");
                          }
                        }}
                      >
                        Add
                      </s-button>
                    </s-stack>
                  </s-stack>
                </s-stack>
              </s-modal>

              {/* offer  end......................................................................... */}

              {/* Campaign settings */}
              <s-section>
                <s-heading>Campaign settings</s-heading>
                <s-stack direction="block" gap="none">
                  <s-checkbox name="showQuantityPicker" label="Show quantity picker" />
                  <s-checkbox name="allowDeselectTrigger" label="Allow customers to de-select the trigger product" />
                  <s-checkbox name="doNotPreselect" label="Do not preselect the items in the bundle" />
                  <s-checkbox name="randomizeOrder" label="Randomize the order of offer products" />
                  <s-checkbox name="limitProducts" label="Limit number of offered products shown" />
                </s-stack>
              </s-section>

              {/* Discounts */}
              <s-section>
                <s-heading>Discounts</s-heading>
                <s-box>
                  <s-select
                    name="discount"
                    placeholder="No discount"
                  >
                    <s-option value="none">No discount</s-option>
                    <s-option value="selleasy">Use Selleasy discount functions (Recommended)</s-option>
                    <s-option value="dynamic">Use discounts that are dynamically created</s-option>
                    <s-option value="existing">Use an already existing discount code</s-option>
                  </s-select>
                </s-box>
              </s-section>

              {/* Schedule campaign */}
              <s-section>
                <s-stack direction="inline" gap="base" alignItems="center" justifyContent="space-between">
                  <s-stack direction="inline" gap="base" alignItems="center">
                    <s-heading>Schedule campaign</s-heading>
                    <s-badge tone="success">Active</s-badge>
                  </s-stack>

                  <s-stack direction="inline" gap="small" alignItems="center">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 2C5.79086 2 4 3.79086 4 6C4 8.5 8 14 8 14C8 14 12 8.5 12 6C12 3.79086 10.2091 2 8 2Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
                      <circle cx="8" cy="6" r="1.5" fill="currentColor" />
                    </svg>
                    <s-text>America / New York (EST)</s-text>
                  </s-stack>
                </s-stack>
                <s-paragraph>
                  Choose a start and end date to control when your campaign goes live.
                </s-paragraph>
                <s-stack gap="small">

                  <s-stack direction="inline" gap="base" alignItems="end">
                    <s-box inlineSize="455px">
                      <s-text-field
                        name="startDate"
                        label="Start date"
                        defaultValue="2026-01-16"
                      />
                    </s-box>
                    <s-box inlineSize="463px">
                      <s-text-field
                        name="startTime"
                        label="Start time (EST)"
                        defaultValue="12:37 AM"
                      />
                    </s-box>
                  </s-stack>


                  <s-checkbox
                    name="setEndDate"
                    label="Set end date"
                    checked={setEndDate}
                    onChange={(e) => setSetEndDate(Boolean(e.currentTarget.checked))}
                  />
                  {setEndDate && (
                    <s-stack direction="inline" gap="base" alignItems="end">
                      <s-box inlineSize="455px">
                        <s-text-field
                          name="endDate"
                          label="End date"
                          defaultValue="2026-02-16"
                        />
                      </s-box>
                      <s-box inlineSize="463px">
                        <s-text-field
                          name="endTime"
                          label="End time (EST)"
                          defaultValue="12:56 AM"
                        />
                      </s-box>
                    </s-stack>
                  )}
                </s-stack>
              </s-section>

              {/* Other settings */}
              <s-section>
                <s-heading>Other settings</s-heading>
                <s-stack direction="block" gap="base">
                  <s-stack direction="block" gap="small">
                    <s-text-field name="campaignTitle" placeholder="Optional. Eg: People also bought" label="Campaign title" />
                    <s-paragraph>This setting overrides the widget's default title</s-paragraph>
                  </s-stack>
                  <s-stack direction="block" gap="small">
                    <s-text-field name="campaignSubtitle" placeholder="Optional. Eg: Flaunt your style with this recommended outfit" label="Campaign sub-title" />
                    <s-paragraph>This setting overrides the widget's default subtitle and supports {`{{discount}}`} and {`{{timer}}`} templates.</s-paragraph>
                  </s-stack>
                  <s-stack direction="block" gap="small">
                    <s-text-field name="campaignPriority" placeholder="Optional. Eg: 10" label="Campaign priority" />
                    <s-paragraph>When several campaigns match a trigger product, the app will display the campaign with the highest priority.</s-paragraph>
                  </s-stack>
                </s-stack>
              </s-section>

              {/* Save button */}
              <s-stack paddingBlockEnd="large-500" direction="inline" gap="base" justifyContent="end">
                <s-button variant="primary" tone="critical">Delete campaign</s-button>

                <s-button
                  variant="primary"
                  loading={isSaving}
                  disabled={isSaving}
                  type="button"
                  onClick={handleSaveCampaign}
                  commandFor="modal"
                >
                  Save
                </s-button>

                <s-modal id="modal" heading="Test campaign in store">
                  {/* Loading State */}
                  {isValidating && (
                    <s-stack direction="block" gap="base" alignItems="center" paddingBlock="large">
                      <s-spinner size="large" />
                      <s-text>Validating campaign...</s-text>
                    </s-stack>
                  )}

                  {/* Validation Results */}
                  {!isValidating && validationResults && (
                    <s-stack direction="block" gap="base">
                      <s-stack direction="inline" gap="base" alignItems="center" justifyContent="space-between">
                        <s-paragraph>
                          The campaign is shown only if these criteria are met
                        </s-paragraph>
                        <s-button variant="tertiary" onClick={() => {
                          setIsValidating(true);
                          setValidationResults(null);
                          setTimeout(() => {
                            setIsValidating(false);
                            setValidationResults(validationResults);
                          }, 1000);
                        }}>
                          <s-stack direction="inline" gap="small" alignItems="center">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M13.5 8C13.5 11.0376 11.0376 13.5 8 13.5M2.5 8C2.5 4.96243 4.96243 2.5 8 2.5M8 2.5L6 4.5M8 2.5L10 4.5M8 13.5L6 11.5M8 13.5L10 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Refresh
                          </s-stack>
                        </s-button>
                      </s-stack>

                      <s-text>
                        {[validationResults.campaignActive, validationResults.productsValid, validationResults.postPurchaseConfigured].filter(Boolean).length}/3 checks passed
                      </s-text>

                      <s-stack direction="block" gap="small">
                        {/* Campaign is active */}
                        <s-stack direction="inline" gap="small" alignItems="center">
                          {validationResults.campaignActive ? (
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="10" cy="10" r="9" stroke="var(--p-color-icon-success)" strokeWidth="2" fill="none" />
                              <path d="M6 10L9 13L14 7" stroke="var(--p-color-icon-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          ) : (
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="10" cy="10" r="9" stroke="var(--p-color-icon-critical)" strokeWidth="2" fill="none" />
                              <path d="M7 7L13 13M13 7L7 13" stroke="var(--p-color-icon-critical)" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                          )}
                          <s-text>Campaign is active</s-text>
                        </s-stack>

                        {/* Products are valid */}
                        <s-stack direction="inline" gap="small" alignItems="center">
                          {validationResults.productsValid ? (
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="10" cy="10" r="9" stroke="var(--p-color-icon-success)" strokeWidth="2" fill="none" />
                              <path d="M6 10L9 13L14 7" stroke="var(--p-color-icon-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          ) : (
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="10" cy="10" r="9" stroke="var(--p-color-icon-critical)" strokeWidth="2" fill="none" />
                              <path d="M7 7L13 13M13 7L7 13" stroke="var(--p-color-icon-critical)" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                          )}
                          <s-text>Products are valid and available in online store</s-text>
                        </s-stack>

                        {/* Post-purchase configuration */}
                        <s-stack direction="block" gap="small">
                          <s-stack direction="inline" gap="small" alignItems="center">
                            {validationResults.postPurchaseConfigured ? (
                              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="10" cy="10" r="9" stroke="var(--p-color-icon-success)" strokeWidth="2" fill="none" />
                                <path d="M6 10L9 13L14 7" stroke="var(--p-color-icon-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            ) : (
                              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="10" cy="10" r="9" stroke="var(--p-color-icon-critical)" strokeWidth="2" fill="var(--p-color-bg-critical-subdued)" />
                                <path d="M10 6V10M10 14H10.01" stroke="var(--p-color-icon-critical)" strokeWidth="2" strokeLinecap="round" />
                              </svg>
                            )}
                            <s-text>Selleasy app is not configured for Post-purchase page</s-text>
                          </s-stack>
                          {!validationResults.postPurchaseConfigured && (
                            <s-stack direction="block" gap="small" paddingInlineStart="large">
                              <s-text>
                                Choose the "Selleasy" app in the Post-purchase page section in store settings.{" "}
                                <s-link href="#" onClick={(e) => {
                                  e.preventDefault();
                                  // Open guide or help
                                }}>View guide</s-link>
                              </s-text>
                              <s-button
                                variant="secondary"
                                onClick={() => {
                                  const shopDomain = window.location.search.match(/shop=([^&]+)/)?.[1]?.replace('.myshopify.com', '') || '';
                                  if (shopDomain) {
                                    window.open(`https://admin.shopify.com/store/${shopDomain}/settings/checkout/editor?page=thank-you&context=apps`, '_blank');
                                  }
                                }}
                              >
                                <s-stack direction="inline" gap="small" alignItems="center">
                                  <span>Go to store settings</span>
                                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M6 3H3C2.44772 3 2 3.44772 2 4V13C2 13.5523 2.44772 14 3 14H12C12.5523 14 13 13.5523 13 13V10M10 2H14M14 2V6M14 2L6 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </s-stack>
                              </s-button>
                            </s-stack>
                          )}
                        </s-stack>
                      </s-stack>

                      {/* Modal Footer */}
                      <s-stack direction="inline" gap="base" alignItems="center" justifyContent="end" paddingBlockStart="base">
                        <s-link href="#" onClick={(e) => {
                          e.preventDefault();
                          // Show help
                        }}>Need help</s-link>
                        <s-button
                          variant="secondary"
                          onClick={() => {
                            // Open store frontend
                            const shopDomain = window.location.search.match(/shop=([^&]+)/)?.[1] || '';
                            if (shopDomain) {
                              window.open(`https://${shopDomain}`, '_blank');
                            }
                          }}
                        >
                          <s-stack direction="inline" gap="small" alignItems="center">
                            <span>View in your store</span>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M6 3H3C2.44772 3 2 3.44772 2 4V13C2 13.5523 2.44772 14 3 14H12C12.5523 14 13 13.5523 13 13V10M10 2H14M14 2V6M14 2L6 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </s-stack>
                        </s-button>
                      </s-stack>
                    </s-stack>
                  )}

                </s-modal>

              </s-stack>

            </s-stack>
          </form>
        </s-stack>

      )}


      {/* Dashboard Content - Only show when on dashboard step */}
      {currentStep === "dashboard" && (
        <s-section>
          <s-stack direction="inline" justifyContent="space-between" alignItems="center">
            <s-stack direction="inline" columnGap="base" alignItems="center">
              <s-heading>SmartSell app embed is</s-heading>
              <s-badge tone={isAppEmbedEnabled ? "success" : "caution"}>
                {isAppEmbedEnabled ? "Enabled" : "Disabled"}
              </s-badge>
            </s-stack>

            <s-stack direction="inline" columnGap="base">
              {isAppEmbedEnabled && (
                <s-button
                  variant="tertiary"
                  onClick={handleRefresh}
                  loading={isRefreshing}
                  disabled={isRefreshing}
                >
                  {!isRefreshing && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--p-space-100)" }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: "inline-block", verticalAlign: "middle" }}>
                        <path d="M13.5 8C13.5 11.0376 11.0376 13.5 8 13.5M2.5 8C2.5 4.96243 4.96243 2.5 8 2.5M8 2.5L6 4.5M8 2.5L10 4.5M8 13.5L6 11.5M8 13.5L10 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Refresh
                    </span>
                  )}
                </s-button>
              )}
              <s-button 
                variant="primary" 
                onClick={handleEnable}
                loading={isEnabling}
                disabled={isEnabling || isAppEmbedEnabled}
              >
                {isAppEmbedEnabled ? "Disable" : "Enable"}
              </s-button>
            </s-stack>
          </s-stack>
        </s-section>
      )}
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
