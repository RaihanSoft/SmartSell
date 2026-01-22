#!/bin/bash

# Test script for the /api/ingest endpoint
# This simulates what the Web Pixel will send to your backend

echo "🧪 Testing SmartSell /api/ingest endpoint..."
echo ""

# Test payload (simulates Web Pixel data)
PAYLOAD='{
  "event": "checkout_completed",
  "orderId": "gid://shopify/Order/5678901234",
  "items": [
    {
      "productId": "gid://shopify/Product/1234567890",
      "variantId": "gid://shopify/ProductVariant/9876543210",
      "quantity": 2,
      "title": "Test Product",
      "variantTitle": "Large / Blue",
      "price": "29.99",
      "currencyCode": "USD"
    },
    {
      "productId": "gid://shopify/Product/1111111111",
      "variantId": "gid://shopify/ProductVariant/2222222222",
      "quantity": 1,
      "title": "Another Product",
      "variantTitle": "Default",
      "price": "19.99",
      "currencyCode": "USD"
    }
  ],
  "timestamp": "2026-01-22T10:30:45.123Z",
  "totalQuantity": 3,
  "subtotalPrice": "79.97",
  "currencyCode": "USD"
}'

# Your backend URL (update if different)
URL="https://agaricaceous-breana-floggingly.ngrok-free.dev/api/ingest"

echo "Sending test payload to: $URL"
echo ""

# Send POST request
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$URL" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

# Extract HTTP status code
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "📬 Response:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""
echo "Status Code: $HTTP_CODE"

if [ "$HTTP_CODE" == "200" ]; then
  echo "✅ Test PASSED - Endpoint is working!"
else
  echo "❌ Test FAILED - Check your backend"
fi
