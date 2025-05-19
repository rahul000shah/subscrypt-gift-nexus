
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

// Define types for our data models
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  created_at: string;
}

export interface Platform {
  id: string;
  name: string;
  type: "subscription" | "gift_card";
  description: string;
  logo_url: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  customer_id: string;
  platform_id: string;
  type: string;
  start_date: string;
  expiry_date: string;
  cost: number;
  status: "active" | "expired" | "pending" | "cancelled";
  notes: string;
  created_at: string;
}

interface DataContextType {
  customers: Customer[];
  platforms: Platform[];
  subscriptions: Subscription[];
  addCustomer: (customer: Omit<Customer, "id" | "created_at">) => Promise<Customer>;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<Customer>;
  deleteCustomer: (id: string) => Promise<void>;
  getCustomer: (id: string) => Customer | undefined;
  addPlatform: (platform: Omit<Platform, "id" | "created_at">) => Promise<Platform>;
  updatePlatform: (id: string, platform: Partial<Platform>) => Promise<Platform>;
  deletePlatform: (id: string) => Promise<void>;
  getPlatform: (id: string) => Platform | undefined;
  addSubscription: (subscription: Omit<Subscription, "id" | "created_at">) => Promise<Subscription>;
  updateSubscription: (id: string, subscription: Partial<Subscription>) => Promise<Subscription>;
  deleteSubscription: (id: string) => Promise<void>;
  getSubscription: (id: string) => Subscription | undefined;
  getCustomerSubscriptions: (customerId: string) => Subscription[];
  getPlatformSubscriptions: (platformId: string) => Subscription[];
  loading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Mock data for initial setup
const MOCK_CUSTOMERS: Customer[] = [
  {
    id: "c1",
    name: "Rahul Shah",
    email: "rahul.shah@example.com",
    phone: "+977-9801234567",
    address: "Kathmandu, Nepal",
    created_at: new Date(2023, 1, 15).toISOString(),
  },
  {
    id: "c2",
    name: "Priya Sharma",
    email: "priya.sharma@example.com",
    phone: "+977-9807654321",
    address: "Pokhara, Nepal",
    created_at: new Date(2023, 3, 22).toISOString(),
  },
  {
    id: "c3",
    name: "Anish Thapa",
    email: "anish.thapa@example.com",
    phone: "+977-9841234567",
    address: "Lalitpur, Nepal",
    created_at: new Date(2023, 5, 7).toISOString(),
  }
];

const MOCK_PLATFORMS: Platform[] = [
  {
    id: "p1",
    name: "Netflix",
    type: "subscription",
    description: "Stream movies & TV shows",
    logo_url: "https://cdn4.iconfinder.com/data/icons/logos-and-brands/512/227_Netflix_logo-512.png",
    created_at: new Date(2022, 11, 20).toISOString(),
  },
  {
    id: "p2",
    name: "Amazon Prime",
    type: "subscription",
    description: "Shopping + streaming service",
    logo_url: "https://cdn4.iconfinder.com/data/icons/logos-and-brands/512/12_Prime_Amazon_logo_logos-512.png",
    created_at: new Date(2023, 0, 10).toISOString(),
  },
  {
    id: "p3",
    name: "Steam Gift Card",
    type: "gift_card",
    description: "Steam wallet recharge",
    logo_url: "https://cdn4.iconfinder.com/data/icons/logos-and-brands/512/387_Steam_logo-512.png",
    created_at: new Date(2023, 2, 5).toISOString(),
  },
  {
    id: "p4",
    name: "Spotify",
    type: "subscription",
    description: "Music streaming service",
    logo_url: "https://cdn4.iconfinder.com/data/icons/logos-and-brands/512/315_Spotify_logo-512.png",
    created_at: new Date(2023, 4, 12).toISOString(),
  }
];

const MOCK_SUBSCRIPTIONS: Subscription[] = [
  {
    id: "s1",
    customer_id: "c1",
    platform_id: "p1",
    type: "Monthly",
    start_date: new Date(2023, 9, 1).toISOString(),
    expiry_date: new Date(2023, 10, 1).toISOString(),
    cost: 1499,
    status: "active",
    notes: "Premium plan",
    created_at: new Date(2023, 9, 1).toISOString(),
  },
  {
    id: "s2",
    customer_id: "c2",
    platform_id: "p2",
    type: "Annual",
    start_date: new Date(2023, 8, 15).toISOString(),
    expiry_date: new Date(2024, 8, 15).toISOString(),
    cost: 9999,
    status: "active",
    notes: "",
    created_at: new Date(2023, 8, 15).toISOString(),
  },
  {
    id: "s3",
    customer_id: "c3",
    platform_id: "p3",
    type: "Gift Card",
    start_date: new Date(2023, 7, 20).toISOString(),
    expiry_date: new Date(2024, 7, 20).toISOString(),
    cost: 5000,
    status: "active",
    notes: "Birthday gift",
    created_at: new Date(2023, 7, 20).toISOString(),
  },
  {
    id: "s4",
    customer_id: "c1",
    platform_id: "p4",
    type: "Monthly",
    start_date: new Date(2023, 6, 10).toISOString(),
    expiry_date: new Date(2023, 7, 10).toISOString(),
    cost: 899,
    status: "expired",
    notes: "Individual plan",
    created_at: new Date(2023, 6, 10).toISOString(),
  }
];

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // In a real app, you'd fetch this from your API
        // For now, we're using mock data or local storage if available
        const storedCustomers = localStorage.getItem("cms_customers");
        const storedPlatforms = localStorage.getItem("cms_platforms");
        const storedSubscriptions = localStorage.getItem("cms_subscriptions");

        setCustomers(storedCustomers ? JSON.parse(storedCustomers) : MOCK_CUSTOMERS);
        setPlatforms(storedPlatforms ? JSON.parse(storedPlatforms) : MOCK_PLATFORMS);
        setSubscriptions(storedSubscriptions ? JSON.parse(storedSubscriptions) : MOCK_SUBSCRIPTIONS);
      } catch (error) {
        console.error("Failed to load data", error);
        toast.error("Failed to load data");
        
        // Fall back to mock data
        setCustomers(MOCK_CUSTOMERS);
        setPlatforms(MOCK_PLATFORMS);
        setSubscriptions(MOCK_SUBSCRIPTIONS);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Save data whenever it changes
  useEffect(() => {
    if (!loading) {
      localStorage.setItem("cms_customers", JSON.stringify(customers));
      localStorage.setItem("cms_platforms", JSON.stringify(platforms));
      localStorage.setItem("cms_subscriptions", JSON.stringify(subscriptions));
    }
  }, [customers, platforms, subscriptions, loading]);

  // Customer CRUD operations
  const addCustomer = async (customerData: Omit<Customer, "id" | "created_at">) => {
    const newCustomer: Customer = {
      ...customerData,
      id: uuidv4(),
      created_at: new Date().toISOString()
    };
    
    setCustomers(prev => [...prev, newCustomer]);
    toast.success(`Added customer: ${newCustomer.name}`);
    return newCustomer;
  };

  const updateCustomer = async (id: string, customerData: Partial<Customer>) => {
    const customerIndex = customers.findIndex(c => c.id === id);
    
    if (customerIndex === -1) {
      toast.error(`Customer not found: ${id}`);
      throw new Error(`Customer not found: ${id}`);
    }
    
    const updatedCustomer = {
      ...customers[customerIndex],
      ...customerData
    };
    
    const updatedCustomers = [...customers];
    updatedCustomers[customerIndex] = updatedCustomer;
    
    setCustomers(updatedCustomers);
    toast.success(`Updated customer: ${updatedCustomer.name}`);
    return updatedCustomer;
  };

  const deleteCustomer = async (id: string) => {
    const customerSubs = subscriptions.filter(s => s.customer_id === id);
    
    if (customerSubs.length > 0) {
      toast.error("Cannot delete customer with active subscriptions");
      throw new Error("Cannot delete customer with active subscriptions");
    }
    
    setCustomers(prev => prev.filter(c => c.id !== id));
    toast.success("Customer deleted successfully");
  };

  const getCustomer = (id: string) => {
    return customers.find(c => c.id === id);
  };

  // Platform CRUD operations
  const addPlatform = async (platformData: Omit<Platform, "id" | "created_at">) => {
    const newPlatform: Platform = {
      ...platformData,
      id: uuidv4(),
      created_at: new Date().toISOString()
    };
    
    setPlatforms(prev => [...prev, newPlatform]);
    toast.success(`Added platform: ${newPlatform.name}`);
    return newPlatform;
  };

  const updatePlatform = async (id: string, platformData: Partial<Platform>) => {
    const platformIndex = platforms.findIndex(p => p.id === id);
    
    if (platformIndex === -1) {
      toast.error(`Platform not found: ${id}`);
      throw new Error(`Platform not found: ${id}`);
    }
    
    const updatedPlatform = {
      ...platforms[platformIndex],
      ...platformData
    };
    
    const updatedPlatforms = [...platforms];
    updatedPlatforms[platformIndex] = updatedPlatform;
    
    setPlatforms(updatedPlatforms);
    toast.success(`Updated platform: ${updatedPlatform.name}`);
    return updatedPlatform;
  };

  const deletePlatform = async (id: string) => {
    const platformSubs = subscriptions.filter(s => s.platform_id === id);
    
    if (platformSubs.length > 0) {
      toast.error("Cannot delete platform with active subscriptions");
      throw new Error("Cannot delete platform with active subscriptions");
    }
    
    setPlatforms(prev => prev.filter(p => p.id !== id));
    toast.success("Platform deleted successfully");
  };

  const getPlatform = (id: string) => {
    return platforms.find(p => p.id === id);
  };

  // Subscription CRUD operations
  const addSubscription = async (subscriptionData: Omit<Subscription, "id" | "created_at">) => {
    const newSubscription: Subscription = {
      ...subscriptionData,
      id: uuidv4(),
      created_at: new Date().toISOString()
    };
    
    setSubscriptions(prev => [...prev, newSubscription]);
    toast.success("Subscription added successfully");
    return newSubscription;
  };

  const updateSubscription = async (id: string, subscriptionData: Partial<Subscription>) => {
    const subscriptionIndex = subscriptions.findIndex(s => s.id === id);
    
    if (subscriptionIndex === -1) {
      toast.error(`Subscription not found: ${id}`);
      throw new Error(`Subscription not found: ${id}`);
    }
    
    const updatedSubscription = {
      ...subscriptions[subscriptionIndex],
      ...subscriptionData
    };
    
    const updatedSubscriptions = [...subscriptions];
    updatedSubscriptions[subscriptionIndex] = updatedSubscription;
    
    setSubscriptions(updatedSubscriptions);
    toast.success("Subscription updated successfully");
    return updatedSubscription;
  };

  const deleteSubscription = async (id: string) => {
    setSubscriptions(prev => prev.filter(s => s.id !== id));
    toast.success("Subscription deleted successfully");
  };

  const getSubscription = (id: string) => {
    return subscriptions.find(s => s.id === id);
  };

  const getCustomerSubscriptions = (customerId: string) => {
    return subscriptions.filter(s => s.customer_id === customerId);
  };

  const getPlatformSubscriptions = (platformId: string) => {
    return subscriptions.filter(s => s.platform_id === platformId);
  };

  return (
    <DataContext.Provider value={{
      customers,
      platforms,
      subscriptions,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      getCustomer,
      addPlatform,
      updatePlatform,
      deletePlatform,
      getPlatform,
      addSubscription,
      updateSubscription,
      deleteSubscription,
      getSubscription,
      getCustomerSubscriptions,
      getPlatformSubscriptions,
      loading
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};
