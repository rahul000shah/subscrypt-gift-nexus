import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Define types for our data models
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  created_at: string;
}

export interface Platform {
  id: string;
  name: string;
  type: "subscription" | "gift_card";
  description: string | null;
  logo_url: string | null;
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
  notes: string | null;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  type: "expiring_soon" | "expired" | "payment_due";
  title: string;
  message: string;
  date: string;
  read: boolean;
  related_id: string | null;
  created_at: string;
}

interface DataContextType {
  customers: Customer[];
  platforms: Platform[];
  subscriptions: Subscription[];
  notifications: NotificationItem[];
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
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  getUnreadNotificationsCount: () => number;
  loading: boolean;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Function to generate payment reminders based on subscriptions
const generateNotifications = async (subscriptions: Subscription[]) => {
  const today = new Date();
  const newNotifications: Omit<NotificationItem, "id" | "created_at">[] = [];
  const existingNotifications: NotificationItem[] = [];
  
  // Get existing notifications to avoid duplicates
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*');

  if (notifications) {
    existingNotifications.push(...notifications.map(n => ({
      ...n,
      type: n.type as NotificationItem["type"]
    })));
  }

  for (const subscription of subscriptions) {
    const expiryDate = new Date(subscription.expiry_date);
    const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // Get customer and platform details
    const { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('id', subscription.customer_id)
      .single();
      
    const { data: platform } = await supabase
      .from('platforms')
      .select('*')
      .eq('id', subscription.platform_id)
      .single();
    
    if (!customer || !platform) continue;
    
    // Check for subscriptions expiring in the next 7 days
    if (subscription.status === 'active' && daysUntilExpiry <= 7 && daysUntilExpiry >= 0) {
      // Check if notification already exists
      const exists = existingNotifications.some(n => 
        n.type === 'expiring_soon' && 
        n.related_id === subscription.id
      );
      
      if (!exists) {
        newNotifications.push({
          type: "expiring_soon",
          title: `Subscription Expiring Soon`,
          message: `${customer.name}'s ${platform.name} subscription expires on ${new Date(subscription.expiry_date).toLocaleDateString()}`,
          date: today.toISOString(),
          read: false,
          related_id: subscription.id
        });
      }
    }
    
    // Check for expired subscriptions
    if (subscription.status === 'active' && daysUntilExpiry < 0 && daysUntilExpiry > -30) {
      // Check if notification already exists
      const exists = existingNotifications.some(n => 
        n.type === 'expired' && 
        n.related_id === subscription.id
      );
      
      if (!exists) {
        newNotifications.push({
          type: "expired",
          title: `Subscription Expired`,
          message: `${customer.name}'s ${platform.name} subscription has expired on ${new Date(subscription.expiry_date).toLocaleDateString()}`,
          date: expiryDate.toISOString(),
          read: false,
          related_id: subscription.id
        });
        
        // Update subscription status to expired
        await supabase
          .from('subscriptions')
          .update({ status: 'expired' })
          .eq('id', subscription.id);
      }
    }
  }
  
  // Insert new notifications
  if (newNotifications.length > 0) {
    await supabase.from('notifications').insert(newNotifications);
  }
};

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Function to fetch all data from Supabase
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch customers
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (customersError) throw customersError;
      
      // Fetch platforms
      const { data: platformsData, error: platformsError } = await supabase
        .from('platforms')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (platformsError) throw platformsError;
      
      // Fetch subscriptions
      const { data: subscriptionsData, error: subscriptionsError } = await supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (subscriptionsError) throw subscriptionsError;
      
      // Fetch notifications
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notifications')
        .select('*')
        .order('date', { ascending: false });
      
      if (notificationsError) throw notificationsError;
      
      // Generate notifications based on subscription status
      if (subscriptionsData) {
        await generateNotifications(subscriptionsData.map(s => ({
          ...s,
          status: s.status as Subscription["status"]
        })));
      }
      
      // Fetch notifications again to include newly generated ones
      const { data: updatedNotifications } = await supabase
        .from('notifications')
        .select('*')
        .order('date', { ascending: false });
      
      // Update state with fetched data, making sure to cast types properly
      setCustomers(customersData || []);
      
      // Ensure proper type casting for platforms
      setPlatforms((platformsData || []).map(p => ({
        ...p,
        type: p.type as Platform["type"]
      })));
      
      // Ensure proper type casting for subscriptions
      setSubscriptions((subscriptionsData || []).map(s => ({
        ...s,
        status: s.status as Subscription["status"] 
      })));
      
      // Ensure proper type casting for notifications
      setNotifications((updatedNotifications || []).map(n => ({
        ...n, 
        type: n.type as NotificationItem["type"]
      })));
      
    } catch (error) {
      console.error("Failed to load data from Supabase", error);
      toast.error("Failed to load data from database");
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchData();
    
    // Set up real-time subscriptions for all tables
    const customersSubscription = supabase
      .channel('public:customers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, fetchData)
      .subscribe();
      
    const platformsSubscription = supabase
      .channel('public:platforms')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'platforms' }, fetchData)
      .subscribe();
      
    const subscriptionsSubscription = supabase
      .channel('public:subscriptions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subscriptions' }, fetchData)
      .subscribe();
      
    const notificationsSubscription = supabase
      .channel('public:notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, fetchData)
      .subscribe();
    
    // Clean up subscriptions on unmount
    return () => {
      supabase.removeChannel(customersSubscription);
      supabase.removeChannel(platformsSubscription);
      supabase.removeChannel(subscriptionsSubscription);
      supabase.removeChannel(notificationsSubscription);
    };
  }, []);

  // Customer CRUD operations
  const addCustomer = async (customerData: Omit<Customer, "id" | "created_at">) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert(customerData)
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success(`Added customer: ${data.name}`);
      return data;
    } catch (error: any) {
      console.error("Failed to add customer", error);
      toast.error(error.message || "Failed to add customer");
      throw error;
    }
  };

  const updateCustomer = async (id: string, customerData: Partial<Customer>) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .update(customerData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success(`Updated customer: ${data.name}`);
      return data;
    } catch (error: any) {
      console.error("Failed to update customer", error);
      toast.error(error.message || "Failed to update customer");
      throw error;
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success("Customer deleted successfully");
    } catch (error: any) {
      console.error("Failed to delete customer", error);
      toast.error(error.message || "Failed to delete customer");
      throw error;
    }
  };

  const getCustomer = (id: string) => {
    return customers.find(c => c.id === id);
  };

  // Platform CRUD operations
  const addPlatform = async (platformData: Omit<Platform, "id" | "created_at">) => {
    try {
      const { data, error } = await supabase
        .from('platforms')
        .insert(platformData)
        .select()
        .single();
      
      if (error) throw error;
      
      // Cast the type to match our Platform interface
      const typedData: Platform = {
        ...data,
        type: data.type as Platform["type"]
      };
      
      toast.success(`Added platform: ${typedData.name}`);
      return typedData;
    } catch (error: any) {
      console.error("Failed to add platform", error);
      toast.error(error.message || "Failed to add platform");
      throw error;
    }
  };

  const updatePlatform = async (id: string, platformData: Partial<Platform>) => {
    try {
      const { data, error } = await supabase
        .from('platforms')
        .update(platformData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Cast the type to match our Platform interface
      const typedData: Platform = {
        ...data,
        type: data.type as Platform["type"]
      };
      
      toast.success(`Updated platform: ${typedData.name}`);
      return typedData;
    } catch (error: any) {
      console.error("Failed to update platform", error);
      toast.error(error.message || "Failed to update platform");
      throw error;
    }
  };

  const deletePlatform = async (id: string) => {
    try {
      const { error } = await supabase
        .from('platforms')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success("Platform deleted successfully");
    } catch (error: any) {
      console.error("Failed to delete platform", error);
      toast.error(error.message || "Failed to delete platform");
      throw error;
    }
  };

  const getPlatform = (id: string) => {
    return platforms.find(p => p.id === id);
  };

  // Subscription CRUD operations
  const addSubscription = async (subscriptionData: Omit<Subscription, "id" | "created_at">) => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .insert(subscriptionData)
        .select()
        .single();
      
      if (error) throw error;
      
      // Cast the type to match our Subscription interface
      const typedData: Subscription = {
        ...data,
        status: data.status as Subscription["status"]
      };
      
      toast.success("Subscription added successfully");
      return typedData;
    } catch (error: any) {
      console.error("Failed to add subscription", error);
      toast.error(error.message || "Failed to add subscription");
      throw error;
    }
  };

  const updateSubscription = async (id: string, subscriptionData: Partial<Subscription>) => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .update(subscriptionData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Cast the type to match our Subscription interface
      const typedData: Subscription = {
        ...data,
        status: data.status as Subscription["status"]
      };
      
      toast.success("Subscription updated successfully");
      return typedData;
    } catch (error: any) {
      console.error("Failed to update subscription", error);
      toast.error(error.message || "Failed to update subscription");
      throw error;
    }
  };

  const deleteSubscription = async (id: string) => {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success("Subscription deleted successfully");
    } catch (error: any) {
      console.error("Failed to delete subscription", error);
      toast.error(error.message || "Failed to delete subscription");
      throw error;
    }
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
  
  // Notification operations
  const markNotificationAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
      
      if (error) throw error;
      
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, read: true } 
            : notification
        )
      );
      
      toast.success("Notification marked as read");
    } catch (error: any) {
      console.error("Failed to mark notification as read", error);
      toast.error(error.message || "Failed to mark notification as read");
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('read', false);
      
      if (error) throw error;
      
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      
      toast.success("All notifications marked as read");
    } catch (error: any) {
      console.error("Failed to mark all notifications as read", error);
      toast.error(error.message || "Failed to mark all notifications as read");
    }
  };

  const getUnreadNotificationsCount = () => {
    return notifications.filter(n => !n.read).length;
  };

  // Function to manually refresh data
  const refreshData = async () => {
    await fetchData();
  };

  return (
    <DataContext.Provider value={{
      customers,
      platforms,
      subscriptions,
      notifications,
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
      markNotificationAsRead,
      markAllNotificationsAsRead,
      getUnreadNotificationsCount,
      loading,
      refreshData
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
