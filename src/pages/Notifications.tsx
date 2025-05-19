
import { useState, useEffect } from "react";
import { useData, NotificationItem } from "@/context/DataContext";
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
  ArrowRightCircle,
  RefreshCw
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, parseISO, isBefore, addDays, isAfter } from "date-fns";
import { useNavigate } from "react-router-dom";

const Notifications = () => {
  const { 
    notifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead, 
    getUnreadNotificationsCount,
    refreshData,
    loading 
  } = useData();
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();
  const unreadCount = getUnreadNotificationsCount();

  const handleMarkAsRead = async (id: string) => {
    await markNotificationAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead();
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setIsRefreshing(false);
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

  const handleViewDetails = (notification: NotificationItem) => {
    if (notification.related_id) {
      navigate(`/subscriptions?id=${notification.related_id}`);
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
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
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
        {loading ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <RefreshCw className="h-10 w-10 text-muted-foreground mb-2 animate-spin" />
              <p className="text-muted-foreground">Loading notifications...</p>
            </CardContent>
          </Card>
        ) : filteredNotifications.length === 0 ? (
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
                {notification.related_id && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="ml-auto"
                    onClick={() => handleViewDetails(notification)}
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
