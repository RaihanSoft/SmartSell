/**
 * Simple in-memory store for installation logs
 * Used to pass server-side logs to client-side for Chrome console display
 */

interface InstallationLog {
  shop: string;
  authUrl: string;
  timestamp: number;
  status: "success" | "error";
  message: string;
  backendResponse?: string;
}

const installationLogs = new Map<string, InstallationLog[]>();

/**
 * Store installation log for a shop
 */
export function storeInstallationLog(shop: string, log: Omit<InstallationLog, "timestamp">) {
  console.log(`💾 Storing installation log for ${shop}:`, log.message);
  
  if (!installationLogs.has(shop)) {
    installationLogs.set(shop, []);
  }
  const logs = installationLogs.get(shop)!;
  const logEntry = {
    ...log,
    timestamp: Date.now(),
  };
  logs.push(logEntry);
  
  console.log(`✅ Log stored. Total logs for ${shop}: ${logs.length}`);
  
  // Keep only last 10 logs per shop
  if (logs.length > 10) {
    logs.shift();
  }
}

/**
 * Get installation logs for a shop
 */
export function getInstallationLogs(shop: string): InstallationLog[] {
  return installationLogs.get(shop) || [];
}

/**
 * Clear logs for a shop (optional cleanup)
 */
export function clearInstallationLogs(shop: string) {
  installationLogs.delete(shop);
}
