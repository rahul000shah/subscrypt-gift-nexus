
import { Customer, Subscription, Platform } from "@/context/DataContext";

/**
 * Format date to YYYY-MM-DD format
 */
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

/**
 * Generate CSV content for subscriptions
 */
const generateSubscriptionsCsv = (subscriptions: Subscription[], customers: Customer[], platforms: Platform[]): string => {
  // CSV Header
  let csvContent = "Customer,Platform,Type,Start Date,Expiry Date,Cost,Status,Notes\n";
  
  // Add rows
  subscriptions.forEach(sub => {
    const customer = customers.find(c => c.id === sub.customer_id)?.name || "Unknown";
    const platform = platforms.find(p => p.id === sub.platform_id)?.name || "Unknown";
    
    const row = [
      `"${customer}"`,
      `"${platform}"`,
      `"${sub.type}"`,
      `"${formatDate(sub.start_date)}"`,
      `"${formatDate(sub.expiry_date)}"`,
      `"${sub.cost}"`,
      `"${sub.status}"`,
      `"${sub.notes || ""}"`,
    ].join(",");
    
    csvContent += row + "\n";
  });
  
  return csvContent;
};

/**
 * Generate CSV content for customers
 */
const generateCustomersCsv = (customers: Customer[], subscriptions: Subscription[]): string => {
  // CSV Header
  let csvContent = "Name,Email,Phone,Address,Active Subscriptions\n";
  
  // Add rows
  customers.forEach(customer => {
    const activeSubscriptionsCount = subscriptions.filter(
      s => s.customer_id === customer.id && s.status === "active"
    ).length;
    
    const row = [
      `"${customer.name}"`,
      `"${customer.email}"`,
      `"${customer.phone || ""}"`,
      `"${customer.address || ""}"`,
      `"${activeSubscriptionsCount}"`,
    ].join(",");
    
    csvContent += row + "\n";
  });
  
  return csvContent;
};

/**
 * Generate CSV content for platforms
 */
const generatePlatformsCsv = (platforms: Platform[], subscriptions: Subscription[]): string => {
  // CSV Header
  let csvContent = "Name,Type,Description,Active Subscriptions\n";
  
  // Add rows
  platforms.forEach(platform => {
    const activeSubscriptionsCount = subscriptions.filter(
      s => s.platform_id === platform.id && s.status === "active"
    ).length;
    
    const row = [
      `"${platform.name}"`,
      `"${platform.type}"`,
      `"${platform.description || ""}"`,
      `"${activeSubscriptionsCount}"`,
    ].join(",");
    
    csvContent += row + "\n";
  });
  
  return csvContent;
};

/**
 * Download data as a CSV file
 */
export const downloadCsv = (filename: string, csvContent: string): void => {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  
  // Create a URL for the blob
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Download subscriptions report
 */
export const downloadSubscriptionsReport = (
  subscriptions: Subscription[], 
  customers: Customer[], 
  platforms: Platform[]
): void => {
  const csvContent = generateSubscriptionsCsv(subscriptions, customers, platforms);
  const filename = `subscriptions-report-${new Date().toISOString().split('T')[0]}.csv`;
  downloadCsv(filename, csvContent);
};

/**
 * Download customers report
 */
export const downloadCustomersReport = (customers: Customer[], subscriptions: Subscription[]): void => {
  const csvContent = generateCustomersCsv(customers, subscriptions);
  const filename = `customers-report-${new Date().toISOString().split('T')[0]}.csv`;
  downloadCsv(filename, csvContent);
};

/**
 * Download platforms report
 */
export const downloadPlatformsReport = (platforms: Platform[], subscriptions: Subscription[]): void => {
  const csvContent = generatePlatformsCsv(platforms, subscriptions);
  const filename = `platforms-report-${new Date().toISOString().split('T')[0]}.csv`;
  downloadCsv(filename, csvContent);
};
