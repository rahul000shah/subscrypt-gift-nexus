
import { useState, useEffect } from "react";
import { useData, Subscription, Customer, Platform } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  BellRing, 
  Search, 
  Clock, 
  Bell, 
  CheckCircle,
  ArrowRightCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, parseISO, isBefore, addDays, isAfter } from "date-fns";
import { format as formatDistance } from "date-fns";
import { toast } from "sonner";

interface NotificationItem {
  id: string;
  type: "expiring_soon" | "expired" | "payment_due";
  title: string;
  message: string;
  date: string;
  read: boolean;
  relatedId?: string;
}

const Notifications = () => {
  const { subscriptions, customers, platforms } = useData();
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Generate notifications based on subscription data
  useEffect(() => {
    const today = new Date();
    const generatedNotifications: NotificationItem[] = [];

    // Check for soon-to-expire subscriptions
    subscriptions.forEach(subscription => {
      if (subscription.status !== "active") return;
      
      const expiryDate = parseISO(subscription.expiry_date);
      const customer = customers.find(c => c.id === subscription.customer_id);
      const platform = platforms.find(p => p.id === subscription.platform_id);
      
      if (!customer || !platform) return;

      // Subscriptions expiring in the next 7 days
      if (isAfter(expiryDate, today) && isBefore(expiryDate, addDays(today, 7))) {
        generatedNotifications.push({
          id: `expiring-${subscription.id}`,
          type: "expiring_soon",
          title: `Subscription Expiring Soon`,
          message: `${customer.name}'s ${platform.name} subscription expires on ${format(expiryDate, 'MMM d, yyyy')}`,
          date: today.toISOString(),
          read: false,
          relatedId: subscription.id
        });
      }
      
      // Subscriptions that expired in the last 30 days
      if (isBefore(expiryDate, today) && isAfter(expiryDate, addDays(today, -30))) {
        generatedNotifications.push({
          id: `expired-${subscription.id}`,
          type: "expired",
          title: `Subscription Expired`,
          message: `${customer.name}'s ${platform.name} subscription has expired on ${format(expiryDate, 'MMM d, yyyy')}`,
          date: expiryDate.toISOString(),
          read: false,
          relatedId: subscription.id
        });
      }
    });
    
    // Add some demo/mock notifications
    generatedNotifications.push({
      id: "payment-reminder-1",
      type: "payment_due",
      title: "Payment Reminder",
      message: "Please collect payment from Rahul Shah for Netflix subscription renewal",
      date: addDays(today, -2).toISOString(),
      read: true,
    });
    
    // Sort notifications by date (most recent first)
    const sortedNotifications = generatedNotifications.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    setNotifications(sortedNotifications);
    setUnreadCount(sortedNotifications.filter(n => !n.read).length);
  }, [subscriptions, customers, platforms]);

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true } 
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
    toast.success("Notification marked as read");
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
    toast.success("All notifications marked as read");
  };

  const filteredNotifications = notifications.filter(notification => {
    const query = searchQuery.toLowerCase();
    return (
      notification.title.toLowerCase().includes(query) ||
      notification.message.toLowerCase().includes(query)
    );
  });

  const getRelativeTime = (dateString: string) => {
    const date = parseISO(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays <= 7) {
      return `${diffDays} days ago`;
    } else {
      return format(date, 'MMM d, yyyy');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "expiring_soon":
        return <Clock className="h-5 w-5 text-amber-500" />;
      case "expired":
        return <BellRing className="h-5 w-5 text-red-500" />;
      case "payment_due":
        return <ArrowRightCircle className="h-5 w-5 text-blue-500" />;
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated with expiring subscriptions and alerts
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={handleMarkAllAsRead}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search notifications..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {unreadCount > 0 && (
          <div className="flex items-center">
            <Badge variant="secondary" className="mr-2">
              {unreadCount} unread
            </Badge>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Bell className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No notifications found</p>
              {searchQuery && (
                <Button 
                  variant="link" 
                  onClick={() => setSearchQuery("")}
                  className="mt-2"
                >
                  Clear search
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => (
            <Card key={notification.id} className={notification.read ? "" : "bg-primary/5 dark:bg-primary/10"}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    {getNotificationIcon(notification.type)}
                    <CardTitle className="ml-2 text-lg">{notification.title}</CardTitle>
                    {!notification.read && (
                      <span className="ml-2 w-2 h-2 rounded-full bg-primary"></span>
                    )}
                  </div>
                  <CardDescription className="text-xs">
                    {getRelativeTime(notification.date)}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p>{notification.message}</p>
              </CardContent>
              <CardFooter>
                {!notification.read && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    Mark as read
                  </Button>
                )}
                {notification.relatedId && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="ml-auto"
                  >
                    View Details
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;
