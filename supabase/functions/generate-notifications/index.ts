
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.22.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Subscription {
  id: string;
  customer_id: string;
  platform_id: string;
  type: string;
  start_date: string;
  expiry_date: string;
  cost: number;
  status: "active" | "expired" | "pending" | "cancelled";
  notes: string | null;
}

interface Customer {
  id: string;
  name: string;
}

interface Platform {
  id: string;
  name: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get all active subscriptions
    const { data: subscriptions, error: subscriptionsError } = await supabaseClient
      .from("subscriptions")
      .select("*")
      .eq("status", "active");

    if (subscriptionsError) {
      throw subscriptionsError;
    }

    // Get existing notifications
    const { data: existingNotifications, error: notificationsError } = await supabaseClient
      .from("notifications")
      .select("*");

    if (notificationsError) {
      throw notificationsError;
    }

    const today = new Date();
    const newNotifications = [];
    const subscriptionsToUpdate = [];

    for (const subscription of subscriptions) {
      const expiryDate = new Date(subscription.expiry_date);
      const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // Get customer and platform info
      const { data: customer } = await supabaseClient
        .from("customers")
        .select("name")
        .eq("id", subscription.customer_id)
        .single();
        
      const { data: platform } = await supabaseClient
        .from("platforms")
        .select("name")
        .eq("id", subscription.platform_id)
        .single();
      
      if (!customer || !platform) continue;
      
      // Check for subscriptions expiring in the next 7 days
      if (daysUntilExpiry <= 7 && daysUntilExpiry >= 0) {
        // Check if notification already exists
        const exists = existingNotifications.some(n => 
          n.type === 'expiring_soon' && 
          n.related_id === subscription.id
        );
        
        if (!exists) {
          newNotifications.push({
            type: "expiring_soon",
            title: `Subscription Expiring Soon`,
            message: `${customer.name}'s ${platform.name} subscription expires on ${expiryDate.toLocaleDateString()}`,
            date: today.toISOString(),
            read: false,
            related_id: subscription.id
          });
        }
      }
      
      // Check for expired subscriptions
      if (daysUntilExpiry < 0) {
        // Check if notification already exists
        const exists = existingNotifications.some(n => 
          n.type === 'expired' && 
          n.related_id === subscription.id
        );
        
        if (!exists) {
          newNotifications.push({
            type: "expired",
            title: `Subscription Expired`,
            message: `${customer.name}'s ${platform.name} subscription has expired on ${expiryDate.toLocaleDateString()}`,
            date: expiryDate.toISOString(),
            read: false,
            related_id: subscription.id
          });
          
          // Mark subscription as expired
          subscriptionsToUpdate.push({
            id: subscription.id,
            status: "expired"
          });
        }
      }
    }
    
    // Insert new notifications
    if (newNotifications.length > 0) {
      await supabaseClient
        .from("notifications")
        .insert(newNotifications);
    }
    
    // Update expired subscriptions
    for (const sub of subscriptionsToUpdate) {
      await supabaseClient
        .from("subscriptions")
        .update({ status: "expired" })
        .eq("id", sub.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        notificationsCreated: newNotifications.length,
        subscriptionsUpdated: subscriptionsToUpdate.length
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
