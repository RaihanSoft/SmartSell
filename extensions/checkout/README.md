# SmartSell Checkout Tracker - Web Pixel Extension

This Web Pixel tracks checkout completion events and sends order data to the SmartSell backend for analytics and processing.

## ✅ Compliance

- **Built for Shopify Compliant**: Uses official Web Pixel API
- **No PII Collection**: Only collects Order ID, Product ID, Variant ID, and Quantity
- **Automatic Consent Handling**: Respects customer privacy preferences automatically
- **Works with New Checkout**: Designed for Shopify's Checkout Extensibility

## 📦 What Gets Tracked

When a customer completes checkout, this pixel sends:

- **Order ID**: Shopify order identifier
- **Line Items**: Array of purchased items with:
  - Product ID
  - Variant ID
  - Quantity
  - Title (for debugging)
  - Variant Title (for debugging)
  - Price (optional)
- **Metadata**: Total quantity, subtotal, currency code, timestamp

## 🚀 Deployment

### Deploy the Extension

```bash
npm run deploy
```

### Activate the Pixel

After deployment:
1. Install the SmartSell app on a store
2. Go to **Shopify Admin** → **Settings** → **Customer Events**
3. Find **"checkout"** pixel
4. Click **"Connect"** or **"Activate"**

## 📊 Example Payload

```json
{
  "event": "checkout_completed",
  "orderId": "gid://shopify/Order/5678901234",
  "items": [
    {
      "productId": "gid://shopify/Product/1234567890",
      "variantId": "gid://shopify/ProductVariant/9876543210",
      "quantity": 2,
      "title": "Cool T-Shirt",
      "variantTitle": "Large / Blue",
      "price": "29.99",
      "currencyCode": "USD"
    }
  ],
  "timestamp": "2026-01-22T10:30:45.123Z",
  "totalQuantity": 2,
  "subtotalPrice": "59.98",
  "currencyCode": "USD"
}
```

## 🔧 Backend Endpoint

The pixel sends data to:
- **URL**: `https://agaricaceous-breana-floggingly.ngrok-free.dev/api/ingest`
- **Method**: POST
- **Content-Type**: application/json

The backend endpoint (`app/routes/api.ingest.tsx`) receives and processes this data.

## 🛡️ Privacy & Consent

- **No Customer PII**: Does not collect names, emails, addresses, or payment info
- **Automatic Consent**: Shopify Web Pixels automatically respect customer consent
- **Compliant**: Follows GDPR, CCPA, and Shopify privacy requirements

## 📚 Resources

- [Shopify Web Pixels Documentation](https://shopify.dev/docs/apps/marketing/pixels)
- [Web Pixel API](https://shopify.dev/docs/api/pixels/pixel-extension)
- [Customer Events API](https://shopify.dev/docs/api/pixels/customer-events)
