
import { supabase } from "./client";
import { Customer, Platform, Subscription } from "@/context/DataContext";

// Mock data for initial setup
const MOCK_CUSTOMERS: Omit<Customer, "id" | "created_at">[] = [
  {
    name: "Rahul Shah",
    email: "rahul.shah@example.com",
    phone: "+977-9801234567",
    address: "Kathmandu, Nepal",
  },
  {
    name: "Priya Sharma",
    email: "priya.sharma@example.com",
    phone: "+977-9807654321",
    address: "Pokhara, Nepal",
  },
  {
    name: "Anish Thapa",
    email: "anish.thapa@example.com",
    phone: "+977-9841234567",
    address: "Lalitpur, Nepal",
  }
];

const MOCK_PLATFORMS: Omit<Platform, "id" | "created_at">[] = [
  {
    name: "Netflix",
    type: "subscription",
    description: "Stream movies & TV shows",
    logo_url: "https://cdn4.iconfinder.com/data/icons/logos-and-brands/512/227_Netflix_logo-512.png",
  },
  {
    name: "Amazon Prime",
    type: "subscription",
    description: "Shopping + streaming service",
    logo_url: "https://cdn4.iconfinder.com/data/icons/logos-and-brands/512/12_Prime_Amazon_logo_logos-512.png",
  },
  {
    name: "Steam Gift Card",
    type: "gift_card",
    description: "Steam wallet recharge",
    logo_url: "https://cdn4.iconfinder.com/data/icons/logos-and-brands/512/387_Steam_logo-512.png",
  },
  {
    name: "Spotify",
    type: "subscription",
    description: "Music streaming service",
    logo_url: "https://cdn4.iconfinder.com/data/icons/logos-and-brands/512/315_Spotify_logo-512.png",
  }
];

// Function to migrate data
export const migrateDataToSupabase = async () => {
  try {
    console.log("Checking if migration is needed...");
    
    // Check if data already exists
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*');
      
    if (customersError) throw customersError;
    
    // If customers already exist, no need to migrate
    if (customers && customers.length > 0) {
      console.log("Data already exists, skipping migration");
      return false;
    }
    
    console.log("Starting data migration...");
    
    // Insert customers
    const { data: insertedCustomers, error: insertCustomersError } = await supabase
      .from('customers')
      .insert(MOCK_CUSTOMERS)
      .select();
      
    if (insertCustomersError) throw insertCustomersError;
    console.log(`Inserted ${insertedCustomers.length} customers`);
    
    // Insert platforms
    const { data: insertedPlatforms, error: insertPlatformsError } = await supabase
      .from('platforms')
      .insert(MOCK_PLATFORMS)
      .select();
      
    if (insertPlatformsError) throw insertPlatformsError;
    console.log(`Inserted ${insertedPlatforms.length} platforms`);
    
    // Create subscriptions
    if (insertedCustomers && insertedPlatforms) {
      const today = new Date();
      
      const subscriptions = [
        {
          customer_id: insertedCustomers[0].id,
          platform_id: insertedPlatforms[0].id, // Netflix
          type: "Monthly",
          start_date: new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString(),
          expiry_date: new Date(today.getFullYear(), today.getMonth() + 1, 1).toISOString(),
          cost: 1499,
          status: "active",
          notes: "Premium plan"
        },
        {
          customer_id: insertedCustomers[1].id,
          platform_id: insertedPlatforms[1].id, // Amazon Prime
          type: "Annual",
          start_date: new Date(today.getFullYear(), today.getMonth() - 2, 15).toISOString(),
          expiry_date: new Date(today.getFullYear() + 1, today.getMonth() - 2, 15).toISOString(),
          cost: 9999,
          status: "active",
          notes: ""
        },
        {
          customer_id: insertedCustomers[2].id,
          platform_id: insertedPlatforms[2].id, // Steam Gift Card
          type: "Gift Card",
          start_date: new Date(today.getFullYear(), today.getMonth() - 3, 20).toISOString(),
          expiry_date: new Date(today.getFullYear() + 1, today.getMonth() - 3, 20).toISOString(),
          cost: 5000,
          status: "active",
          notes: "Birthday gift"
        },
        {
          customer_id: insertedCustomers[0].id,
          platform_id: insertedPlatforms[3].id, // Spotify
          type: "Monthly",
          start_date: new Date(today.getFullYear(), today.getMonth() - 4, 10).toISOString(),
          expiry_date: new Date(today.getFullYear(), today.getMonth() - 3, 10).toISOString(),
          cost: 899,
          status: "expired",
          notes: "Individual plan"
        }
      ];
      
      const { data: insertedSubscriptions, error: insertSubscriptionsError } = await supabase
        .from('subscriptions')
        .insert(subscriptions)
        .select();
        
      if (insertSubscriptionsError) throw insertSubscriptionsError;
      console.log(`Inserted ${insertedSubscriptions.length} subscriptions`);
    }
    
    return true;
  } catch (error) {
    console.error("Error migrating data:", error);
    return false;
  }
};
