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
  const handleRefresh = async () => {
    if (isRefreshing) return; // Prevent multiple clicks

    setIsRefreshing(true);

    // Simulate refresh operation (replace with actual API call if needed)
    try {
      // Add your refresh logic here (e.g., refetch data, update state)
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate API call

      // Show success toast (Polaris pattern)
      shopify.toast.show("App embed refreshed successfully");
    } catch (error) {
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
          <s-stack direction="block" gap="base">
            {/* Campaign name */}
            <s-section>
              <s-heading>Campaign name - for internal reference</s-heading>
              <s-text-field
                placeholder="Required. Eg: Frequently bought together campaign for t-shirts"
                label="Campaign name"
              />
            </s-section>


            {/* Trigger */}
            <s-section>
              <s-heading>Trigger</s-heading>
              <s-paragraph>
                Select the products for which the offer is displayed on the product page.
              </s-paragraph>
              <s-stack direction="block" gap="base">
                <s-select label="Type">
                  <option>Specific products</option>
                </s-select>
                <s-text-field placeholder="Eg. T-shirt" label="Products" />
                <s-stack direction="inline" gap="base">
                  <s-button variant="tertiary">Add condition</s-button>
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
                <s-select label="Selection Method">
                  <option>Manual selection</option>
                  <option>Basic AI</option>
                  <option>ChatGPT powered Selleasy AI (New)</option>
                </s-select>
                <s-select label="Type">
                  <option>Specific products</option>
                </s-select>
                <s-text-field placeholder="Eg. Shorts + Sneakers" label="Products" />
              </s-stack>
            </s-section>

            {/* Campaign settings */}
            <s-section>
              <s-heading>Campaign settings</s-heading>
              <s-stack direction="block" gap="base">
                <s-checkbox label="Show quantity picker" />
                <s-checkbox label="Allow customers to de-select the trigger product" />
                <s-checkbox label="Do not preselect the items in the bundle" />
                <s-checkbox label="Randomize the order of offer products" />
                <s-checkbox label="Limit number of offered products shown" />
              </s-stack>
            </s-section>

            {/* Discounts */}
            <s-section>
              <s-heading>Discounts</s-heading>
              <s-select label="Discount">
                <option>No discount</option>
              </s-select>
            </s-section>

            {/* Schedule campaign */}
            <s-section>
              <s-stack direction="inline" gap="base" alignItems="center">
                <s-heading>Schedule campaign</s-heading>
                <s-badge tone="success">Active</s-badge>
              </s-stack>
              <s-paragraph>
                Choose a start and end date to control when your campaign goes live.
              </s-paragraph>
              <s-stack direction="block" gap="base">
                <s-text-field label="Start date" defaultValue="2026-01-13" />
                <s-text-field label="Start time (EST)" defaultValue="23:57" />
                <s-checkbox label="Set end date" />
              </s-stack>
            </s-section>

            {/* Other settings */}
            <s-section>
              <s-heading>Other settings</s-heading>
              <s-stack direction="block" gap="base">
                <s-text-field placeholder="Optional. Eg: People also bought" label="Campaign title" />
                <s-text-field placeholder="Optional. Eg: Flaunt your style with this recommended outfit" label="Campaign sub-title" />
                <s-text-field placeholder="Optional. Eg: 10" label="Campaign priority" />
              </s-stack>
            </s-section>

            {/* Save button */}
            <s-stack direction="inline" gap="base" justifyContent="end">
              <s-button variant="primary">Save</s-button>
            </s-stack>

          </s-stack>
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
