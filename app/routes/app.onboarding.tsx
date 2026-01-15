import { useState } from "react";
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useNavigate } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

// Loader: Authenticate and prepare onboarding page (follows .cursorrules - server-side authentication)
export const loader = async ({ request }: LoaderFunctionArgs) => {
    await authenticate.admin(request);
    return {};
};

export default function Onboarding() {
    const navigate = useNavigate();

    // Form state management
    const [name, setName] = useState("");
    const [role, setRole] = useState("");
    const [email, setEmail] = useState("");
    const [criticalAlerts, setCriticalAlerts] = useState(false);
    const [newsletter, setNewsletter] = useState(false);

    // Handle role selection change (follows .cursorrules - proper event handling)
    const handleRoleChange = (event: { currentTarget: { value: string } }) => {
        setRole(event.currentTarget.value);
    };

    // Handle onboarding completion (UI only - backend connection will be added later)
    const handleNext = () => {
        // TODO: Connect to backend later to save onboarding data
        // For now, just navigate to dashboard
        navigate("/app");
    };

    return (
        <s-page>
            {/* Title */}
            <s-stack direction="block" gap="base" alignItems="center" paddingBlockEnd="large">
                <s-heading>Welcome! Let's personalize your experience.</s-heading>
            </s-stack>


            {/* White Card Container - Using s-box for proper Polaris structure */}
            <s-stack direction="block" gap="small" alignItems="center">

                <s-box borderRadius="large" inlineSize="600px">
                    <s-section>
                        {/* Form Fields */}
                        <s-stack direction="block" gap="base">
                            {/* Your name */}
                            <s-stack direction="block" gap="small">
                                <s-text-field
                                    label="Your name"
                                    placeholder="Enter your name"
                                    value={name}
                                    onChange={(e) => setName(e.currentTarget.value)}
                                />
                                <s-text color="subdued">
                                    Your name helps us personalize our messages to you.
                                </s-text>
                            </s-stack>

                            {/* Your role */}
                            <s-stack direction="block" gap="small">
                                <s-select
                                    placeholder="Select your role"
                                    label="Role"

                                >
                                    <s-option value="ca">Store-owner</s-option>
                                    <s-option value="us">Marketer</s-option>
                                    <s-option value="mx">Developer</s-option>
                                    <s-option value="uk">Others</s-option>
                                </s-select>
                                <s-text color="subdued">
                                    Your role helps us provide you with the most relevant assistance.
                                </s-text>
                            </s-stack>

                            {/* Best email */}
                            <s-stack direction="block" gap="small">
                                <s-text-field
                                    label="Best email to contact you"
                                    placeholder="Eg. name@email.com, we'll email only when it matters!"
                                    value={email}
                                    onChange={(e) => setEmail(e.currentTarget.value)}
                                />
                                <s-text color="subdued">
                                    We'll only contact you when it's important. Please provide an email you check regularly.
                                </s-text>
                            </s-stack>

                            {/* Communication Preferences */}
                            <s-stack direction="block" gap="none">
                                <s-heading>Communication Preferences</s-heading>

                                <s-stack direction="block" gap="none">
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

                            <s-stack>
                                <s-box padding="base" background="subdued" border="base" borderRadius="base">
                                    <s-stack direction="inline" gap="base" alignItems="start" justifyContent="space-between">
                                        <s-stack direction="block" gap="small">
                                            <s-paragraph>• No spam emails, we promise!</s-paragraph>
                                            <s-paragraph>• Automatically unsubscribes when you uninstall the app.</s-paragraph>
                                        </s-stack>
                                        <s-stack direction="inline" gap="small" alignItems="center">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                                <path d="M12 2L3 6V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V6L12 2Z" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                                <path d="M9 12L11 14L15 10" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            <s-paragraph>No spam Assured!</s-paragraph>
                                        </s-stack>
                                    </s-stack>
                                </s-box>
                            </s-stack>



                            {/* Next Button */}
                            <s-stack direction="inline" gap="base" justifyContent="end" paddingBlockStart="base">
                                <s-button variant="primary" onClick={handleNext}>
                                    Next
                                </s-button>
                            </s-stack>
                        </s-stack>
                    </s-section>
                </s-box>


            </s-stack>


        </s-page>
    );
}

export const headers: HeadersFunction = (headersArgs) => {
    return boundary.headers(headersArgs);
};
