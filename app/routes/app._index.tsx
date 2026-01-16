import { useState } from "react";
import type { HeadersFunction } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";

type CampaignStep = "dashboard" | "campaign-types" | "campaign-form";
type CampaignType = "list" | "amazon" | "classic" | null;

export default function Index() {
  const shopify = useAppBridge();
  const [currentStep, setCurrentStep] = useState<CampaignStep>("dashboard");
  const [selectedCampaignType, setSelectedCampaignType] = useState<CampaignType>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectionMethod, setSelectionMethod] = useState<string>("manual");
  const [setEndDate, setSetEndDate] = useState<boolean>(false);

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
          <s-button  variant="tertiary">Test in store</s-button>
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
                  placeholder="Required. Eg: Frequently bought together campaign for t-shirts"
                  required
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
                    >
                      <s-option value="collections">Collections</s-option>
                      <s-option value="products">Products</s-option>
                      <s-option value="tags">Tags</s-option>
                    </s-select>
                  </s-box>

                  <s-box inlineSize="422px">
                    <s-text-field
                      name="collection"
                      label="Collection"
                      placeholder="Enter collection"
                    />
                  </s-box>

                  <s-button variant="secondary">Browse</s-button>
                </s-stack>

                <s-stack direction="inline" gap="base" alignItems="center" justifyContent="space-between">
                  <s-button variant="secondary">Add condition</s-button>
                  <s-link href="#">View guide</s-link>
                </s-stack>
              </s-stack>

            </s-section>

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
                    >
                      <s-option disabled value="Tigger">Tigger Type</s-option>
                      <s-option value="Products">Specific Products</s-option>
                      <s-option value="Variants">Specific Variants</s-option>
                    </s-select>
                  </s-box>

                  <s-box inlineSize="422px">
                    <s-text-field
                      name="products"
                      label="Products"
                      placeholder="Shorts + Shoes"
                    />
                  </s-box>

                  <s-button variant="secondary">Browse</s-button>
                </s-stack>
              </s-stack>
            </s-section>

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
                    <path d="M8 2C5.79086 2 4 3.79086 4 6C4 8.5 8 14 8 14C8 14 12 8.5 12 6C12 3.79086 10.2091 2 8 2Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                    <circle cx="8" cy="6" r="1.5" fill="currentColor"/>
                  </svg>
                  <s-text>America / New York (EST)</s-text>
                </s-stack>
              </s-stack>
              <s-paragraph>
                Choose a start and end date to control when your campaign goes live.
              </s-paragraph>
              <s-stack  gap="small">

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
                  onChange={(e) => setSetEndDate(e.currentTarget.checked)}
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
              <s-button variant="primary" type="submit">Save</s-button>
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
              <s-heading>Selleasy app embed is</s-heading>
              <s-badge tone="caution">Disabled</s-badge>
            </s-stack>

            <s-stack direction="inline" columnGap="base">
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
              <s-button variant="primary">Enable</s-button>
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
