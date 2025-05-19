
import { useEffect, useState } from "react";
import { useData, Subscription } from "@/context/DataContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  PieChart, 
  Bar, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  Pie, 
  Line,
  LineChart
} from "recharts";
import { format, isAfter, isBefore, addDays, parseISO } from "date-fns";
import { ArrowUpRight, Users, CreditCard, BarChart3, Clock, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { customers, platforms, subscriptions, loading, refreshData } = useData();
  const [upcomingExpirations, setUpcomingExpirations] = useState<Subscription[]>([]);
  const [revenueByPlatform, setRevenueByPlatform] = useState<any[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    calculateDashboardData();
  }, [customers, platforms, subscriptions]);

  const calculateDashboardData = () => {
    // Calculate upcoming expirations (next 30 days)
    const today = new Date();
    const thirtyDaysFromNow = addDays(today, 30);
    
    const upcoming = subscriptions.filter(sub => {
      const expiryDate = parseISO(sub.expiry_date);
      return isAfter(expiryDate, today) && isBefore(expiryDate, thirtyDaysFromNow) && sub.status === "active";
    });
    
    setUpcomingExpirations(upcoming);
    
    // Calculate revenue by platform
    const platformRevenue = platforms.map(platform => {
      const platformSubs = subscriptions.filter(sub => sub.platform_id === platform.id);
      const totalRevenue = platformSubs.reduce((sum, sub) => sum + Number(sub.cost), 0);
      return {
        name: platform.name,
        value: totalRevenue,
        color: getRandomColor(platform.id)
      };
    }).sort((a, b) => b.value - a.value);
    
    setRevenueByPlatform(platformRevenue);
    
    // Calculate monthly revenue for the past 6 months
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      
      const monthName = format(date, 'MMM');
      const year = date.getFullYear();
      const month = date.getMonth();
      
      const monthSubs = subscriptions.filter(sub => {
        const startDate = new Date(sub.start_date);
        return startDate.getMonth() === month && startDate.getFullYear() === year;
      });
      
      const monthlyTotal = monthSubs.reduce((sum, sub) => sum + Number(sub.cost), 0);
      
      months.push({
        name: monthName,
        revenue: monthlyTotal
      });
    }
    
    setMonthlyRevenue(months);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setIsRefreshing(false);
  };

  const getRandomColor = (id: string) => {
    const colors = [
      "#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", 
      "#ec4899", "#06b6d4", "#f97316", "#10b981", "#6366f1"
    ];
    
    // Use the id to consistently get the same color for the same platform
    const hashCode = id.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);
    
    return colors[hashCode % colors.length];
  };

  const statusCount = {
    active: subscriptions.filter(sub => sub.status === "active").length,
    expired: subscriptions.filter(sub => sub.status === "expired").length,
    pending: subscriptions.filter(sub => sub.status === "pending").length,
    cancelled: subscriptions.filter(sub => sub.status === "cancelled").length
  };
  
  const totalRevenue = subscriptions.reduce((sum, sub) => sum + Number(sub.cost), 0);
  const activeRevenue = subscriptions
    .filter(sub => sub.status === "active")
    .reduce((sum, sub) => sum + Number(sub.cost), 0);

  const handleViewAllExpirations = () => {
    navigate('/notifications');
  };

  const generateReport = () => {
    // This would normally generate a downloadable report
    // For now, let's just show a message
    alert("Report generation would happen here in a real application");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={generateReport}>Download Report</Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-10 w-10 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading dashboard data...</span>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Customers</p>
                    <p className="text-3xl font-bold">{customers.length}</p>
                  </div>
                  <div className="rounded-full p-2 bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Platforms</p>
                    <p className="text-3xl font-bold">{platforms.length}</p>
                  </div>
                  <div className="rounded-full p-2 bg-primary/10">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Subscriptions</p>
                    <p className="text-3xl font-bold">{statusCount.active}</p>
                  </div>
                  <div className="rounded-full p-2 bg-primary/10">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                    <p className="text-3xl font-bold">₹{totalRevenue.toLocaleString()}</p>
                  </div>
                  <div className="rounded-full p-2 bg-primary/10">
                    <ArrowUpRight className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Monthly Revenue</CardTitle>
                    <CardDescription>Revenue generated over the past 6 months</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={monthlyRevenue}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`₹${value}`, 'Revenue']} />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="#6366f1" 
                          activeDot={{ r: 8 }}
                          name="Revenue"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue by Platform</CardTitle>
                    <CardDescription>Distribution across platforms</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={revenueByPlatform}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                        >
                          {revenueByPlatform.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `₹${value}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                  <CardHeader>
                    <CardTitle>Subscription Status</CardTitle>
                    <CardDescription>Current status of all subscriptions</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: 'Active', value: statusCount.active, fill: '#22c55e' },
                          { name: 'Pending', value: statusCount.pending, fill: '#f59e0b' },
                          { name: 'Expired', value: statusCount.expired, fill: '#ef4444' },
                          { name: 'Cancelled', value: statusCount.cancelled, fill: '#94a3b8' }
                        ]}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" name="Count" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                
                <Card className="lg:col-span-3">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Upcoming Expirations</CardTitle>
                      <CardDescription>Subscriptions expiring in 30 days</CardDescription>
                    </div>
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {upcomingExpirations.length > 0 ? (
                      <div className="space-y-4">
                        {upcomingExpirations.slice(0, 5).map(sub => {
                          const customer = customers.find(c => c.id === sub.customer_id);
                          const platform = platforms.find(p => p.id === sub.platform_id);
                          
                          return (
                            <div key={sub.id} className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{customer?.name}</p>
                                <p className="text-sm text-muted-foreground">{platform?.name} - {sub.type}</p>
                              </div>
                              <p className="text-sm font-medium">
                                {format(parseISO(sub.expiry_date), 'dd MMM yyyy')}
                              </p>
                            </div>
                          );
                        })}
                        
                        {upcomingExpirations.length > 5 && (
                          <Button variant="outline" className="w-full mt-2" size="sm" onClick={handleViewAllExpirations}>
                            View all {upcomingExpirations.length} expirations
                          </Button>
                        )}
                      </div>
                    ) : (
                      <p className="text-center py-4 text-muted-foreground">No upcoming expirations</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="analytics" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Analysis</CardTitle>
                  <CardDescription>Detailed breakdown of revenue</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                      <p className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Active Revenue</p>
                      <p className="text-2xl font-bold">₹{activeRevenue.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Revenue per Customer</p>
                      <p className="text-2xl font-bold">
                        ₹{customers.length ? Math.round(totalRevenue / customers.length).toLocaleString() : 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default Dashboard;
