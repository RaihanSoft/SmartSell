import '@shopify/ui-extensions/preact';
import {render} from "preact";

// Thank you page extension entry point
export default async () => {
  render(<Extension />, document.body);
};

function Extension() {
  // Access purchase/order data from shopify global
  // For thank you page, we can access order information
  const {purchase} = shopify;

  // Render cross-sell UI
  return (
    <s-banner heading="You might also like">
      <s-stack gap="base">
        <s-text>
          Complete your look with these recommended products!
        </s-text>
        <s-button onClick={handleViewProducts}>
          View Recommended Products
        </s-button>
      </s-stack>
    </s-banner>
  );

  async function handleViewProducts() {
    // Navigate to product recommendations
    // You can customize this to show specific products based on the purchase
    console.log("View recommended products", purchase);
  }
}
