import {register} from "@shopify/web-pixels-extension";

/**
 * SmartSell Checkout Completion Tracker
 * 
 * This Web Pixel tracks checkout completion events and sends order data
 * to the SmartSell backend for processing.
 * 
 * Compliance:
 * - Built for Shopify compliant
 * - No PII collection
 * - Respects customer consent automatically
 * - Works with Shopify's new checkout
 */

register(({ analytics, browser }: any) => {
    // Subscribe to checkout_completed event
    analytics.subscribe('checkout_completed', async (event: any) => {
        try {
            // Extract checkout data from the event
            const checkoutData = event.data.checkout;
            
            // Extract order ID (available after checkout completion)
            const orderId = checkoutData.order?.id || null;
            
            // Extract line items with product and variant information
            const items = checkoutData.lineItems.map((item: any) => ({
                productId: item.variant?.product?.id || null,
                variantId: item.variant?.id || null,
                quantity: item.quantity || 0,
                title: item.title || '',
                variantTitle: item.variant?.title || '',
                // Optional: Include price information for analytics
                price: item.variant?.price?.amount || null,
                currencyCode: checkoutData.currencyCode || null
            }));

            // Prepare payload - NO PII (compliant with Shopify privacy requirements)
            const payload = {
                event: 'checkout_completed',
                orderId: orderId,
                items: items,
                timestamp: new Date().toISOString(),
                // Optional metadata
                totalQuantity: checkoutData.totalQuantity || 0,
                subtotalPrice: checkoutData.subtotalPrice?.amount || null,
                currencyCode: checkoutData.currencyCode || null
            };

            // Send data to SmartSell backend
            const response = await fetch('https://agaricaceous-breana-floggingly.ngrok-free.dev/api/ingest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                // Log error but don't break customer experience
                console.error('SmartSell: Failed to send checkout data:', response.status, response.statusText);
            } else {
                // Optional: Log success for debugging
                console.log('SmartSell: Checkout data sent successfully');
            }
        } catch (error) {
            // Handle any errors gracefully
            console.error('SmartSell: Error in checkout_completed handler:', error);
            // Fail silently - never break the customer checkout experience
        }
    });

    // Optional: Track page views on thank you page for additional analytics
    analytics.subscribe('page_viewed', (event: any) => {
        // Only track if it's the thank you page
        if (event.context?.document?.location?.pathname?.includes('/thank_you') || 
            event.context?.document?.location?.pathname?.includes('/thank-you')) {
            console.log('SmartSell: Thank you page viewed');
            // You can add additional tracking here if needed
        }
    });
});
