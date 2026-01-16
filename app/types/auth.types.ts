/**
 * Authentication query parameters interface
 * Matches Shopify OAuth flow requirements
 */
export interface AuthQueryDto {
  shop?: string;
  embedded?: string;
  host?: string;
}
