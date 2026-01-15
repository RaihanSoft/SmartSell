import { useState } from "react";
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useNavigate } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

// Loader: Authenticate and prepare onboarding page (follows .cursorrules - server-side authentication)
export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return {};
};

export default function Onboarding() {
  const shopify = useAppBridge();
  const navigate = useNavigate();
  
  // Form state management
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [criticalAlerts, setCriticalAlerts] = useState(false);
  const [newsletter, setNewsletter] = useState(false);

  // Handle onboarding completion (UI only - backend connection will be added later)
  const handleNext = () => {
    // TODO: Connect to backend later to save onboarding data
    // For now, just navigate to dashboard
    navigate("/app");
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      backgroundColor: "var(--p-surface-subdued)",
      padding: "var(--p-space-500)"
    }}>
      <s-page>
        {/* Header with Logo and Menu */}
        <s-stack direction="inline" paddingBlockEnd="base" alignItems="center" justifyContent="space-between">
          <s-stack direction="inline" gap="base" alignItems="center">
            <div style={{
              width: "32px",
              height: "32px",
              backgroundColor: "#7C3AED",
              borderRadius: "var(--p-border-radius-base)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: "bold",
              fontSize: "14px",
            }}>
              SE
            </div>
            <s-heading>Selleasy</s-heading>
          </s-stack>
          <s-button variant="tertiary" aria-label="More options">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="10" cy="4" r="1.5" fill="currentColor"/>
              <circle cx="10" cy="10" r="1.5" fill="currentColor"/>
              <circle cx="10" cy="16" r="1.5" fill="currentColor"/>
            </svg>
          </s-button>
        </s-stack>

        {/* White Card Container */}
        <div style={{
          maxWidth: "600px",
          margin: "0 auto",
          backgroundColor: "var(--p-surface)",
          borderRadius: "var(--p-border-radius-large)",
          padding: "var(--p-space-600)",
          boxShadow: "var(--p-shadow-card)"
        }}>
          {/* Title */}
          <s-stack direction="block" gap="base" alignItems="center" paddingBlockEnd="large">
            <s-heading>Welcome! Let's personalize your experience.</s-heading>
          </s-stack>

          {/* Form Fields */}
          <s-stack direction="block" gap="large">
            {/* Your name */}
            <s-stack direction="block" gap="small">
              <s-text-field
                label="Your name"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.currentTarget.value)}
              />
              <div style={{ color: "var(--p-color-text-subdued)" }}>
                <s-text>Your name helps us personalize our messages to you.</s-text>
              </div>
            </s-stack>

            {/* Your role */}
            <s-stack direction="block" gap="small">
              <s-select
                label="Your role"
                value={role}
                onChange={(e) => setRole(e.currentTarget.value)}
              >
                <option value="">Select your role</option>
                <option value="store-owner">Store Owner</option>
                <option value="marketer">Marketer</option>
                <option value="developer">Developer</option>
                <option value="other">Other</option>
              </s-select>
              <div style={{ color: "var(--p-color-text-subdued)" }}>
                <s-text>Your role helps us provide you with the most relevant assistance.</s-text>
              </div>
            </s-stack>

            {/* Best email */}
            <s-stack direction="block" gap="small">
              <s-text-field
                label="Best email to contact you"
                placeholder="Eg. name@email.com, we'll email only when it matters!"
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
              />
              <div style={{ color: "var(--p-color-text-subdued)" }}>
                <s-text>We'll only contact you when it's important. Please provide an email you check regularly.</s-text>
              </div>
            </s-stack>

            {/* Communication Preferences */}
            <s-stack direction="block" gap="base">
              <s-heading>Communication Preferences</s-heading>
              
              <s-stack direction="block" gap="base">
                {/* Critical alerts checkbox */}
                <s-stack direction="inline" gap="base" alignItems="center">
                  <s-checkbox
                    label="Critical alerts & product updates (Approx 2 emails/year)"
                    checked={criticalAlerts}
                    onChange={(e) => setCriticalAlerts(e.currentTarget.checked)}
                  />
                  <s-badge tone="info">Recommended</s-badge>
                </s-stack>

                {/* Newsletter checkbox */}
                <s-checkbox
                  label="Our newsletter featuring Shopify growth strategies (Max 12 emails/year)"
                  checked={newsletter}
                  onChange={(e) => setNewsletter(e.currentTarget.checked)}
                />
              </s-stack>
            </s-stack>

            {/* Spam Assurance Section */}
            <s-stack direction="block" gap="base">
              <s-stack direction="inline" gap="base" alignItems="start">
                <s-stack direction="block" gap="small">
                  <div style={{ color: "var(--p-color-text-subdued)" }}>
                    <s-text>• No spam emails, we promise!</s-text>
                  </div>
                  <div style={{ color: "var(--p-color-text-subdued)" }}>
                    <s-text>• Automatically unsubscribes when you uninstall the app.</s-text>
                  </div>
                </s-stack>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--p-space-200)", marginLeft: "auto" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L3 6V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V6L12 2Z" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    <path d="M9 12L11 14L15 10" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div style={{ color: "var(--p-color-text-subdued)" }}>
                    <s-text>No spam Assured!</s-text>
                  </div>
                </div>
              </s-stack>
            </s-stack>

            {/* Next Button */}
            <s-stack direction="inline" gap="base" justifyContent="end" paddingBlockStart="base">
              <s-button variant="primary" onClick={handleNext}>
                Next
              </s-button>
            </s-stack>
          </s-stack>
        </div>
      </s-page>
    </div>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
