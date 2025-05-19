
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  Settings as SettingsIcon,
  User,
  Bell,
  Lock,
  Mail,
  Globe,
  Save,
  Loader2,
  Download
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useData } from "@/context/DataContext";
import { downloadCustomersReport, downloadSubscriptionsReport, downloadPlatformsReport } from "@/utils/reportUtils";

interface UserSettings {
  id?: string;
  user_id?: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  role?: string;
  language?: string;
  timezone?: string;
  currency?: string;
  company_details?: string;
  notification_preferences?: {
    emailAlerts: boolean;
    expiryReminders: boolean;
    paymentReminders: boolean;
    marketingEmails: boolean;
  };
  created_at?: string;
  updated_at?: string;
}

interface NotificationPreferences {
  emailAlerts: boolean;
  expiryReminders: boolean;
  paymentReminders: boolean;
  marketingEmails: boolean;
}

const Settings = () => {
  const { user } = useAuth();
  const { customers, platforms, subscriptions } = useData();
  const [isLoading, setIsLoading] = useState(false);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "+977-9801234567",
    company: "SubsCMS Inc.",
    role: "admin",
  });
  
  const [notificationSettings, setNotificationSettings] = useState<NotificationPreferences>({
    emailAlerts: true,
    expiryReminders: true,
    paymentReminders: true,
    marketingEmails: false,
  });

  const [appSettings, setAppSettings] = useState({
    language: "en",
    timezone: "Asia/Kathmandu",
    currency: "NPR",
    companyDetails: ""
  });

  // Load user settings from Supabase on component mount
  useEffect(() => {
    const loadUserSettings = async () => {
      if (!user?.id) return;
      
      try {
        // The user_settings table is now in our database schema
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (error && error.code !== 'PGSQL_NO_ROWS_RETURNED') {
          throw error;
        }
        
        if (data) {
          // Properly typed as UserSettings
          setUserSettings(data as UserSettings);
          
          // Update form states with loaded data
          setProfileForm({
            name: data.name || user.name || "",
            email: data.email || user.email || "",
            phone: data.phone || "+977-9801234567",
            company: data.company || "SubsCMS Inc.",
            role: data.role || "admin",
          });
          
          if (data.notification_preferences) {
            setNotificationSettings(data.notification_preferences as NotificationPreferences);
          }
          
          setAppSettings({
            language: data.language || "en",
            timezone: data.timezone || "Asia/Kathmandu",
            currency: data.currency || "NPR",
            companyDetails: data.company_details || ""
          });
        }
      } catch (error) {
        console.error("Error loading user settings:", error);
        toast.error("Failed to load settings");
      }
    };
    
    loadUserSettings();
  }, [user]);

  const handleProfileFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };

  const handleNotificationChange = (setting: string, value: boolean) => {
    setNotificationSettings(prev => ({ ...prev, [setting]: value }));
  };

  const handleAppSettingChange = (name: string, value: string) => {
    setAppSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAppSettings(prev => ({ ...prev, companyDetails: e.target.value }));
  };

  const saveSettingsToSupabase = async (settings: UserSettings) => {
    if (!user?.id) {
      toast.error("User not authenticated");
      return false;
    }
    
    try {
      // Ensure user_id is set
      const dataToSave = {
        ...settings,
        user_id: user.id,
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('user_settings')
        .upsert(dataToSave)
        .select();
        
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error("Error saving settings:", error);
      return false;
    }
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    
    const success = await saveSettingsToSupabase({
      ...userSettings,
      name: profileForm.name,
      email: profileForm.email,
      phone: profileForm.phone,
      company: profileForm.company,
      role: profileForm.role
    });
    
    if (success) {
      toast.success("Profile settings saved");
    } else {
      toast.error("Failed to save profile settings");
    }
    
    setIsLoading(false);
  };

  const handleSaveNotifications = async () => {
    setIsLoading(true);
    
    const success = await saveSettingsToSupabase({
      ...userSettings,
      notification_preferences: notificationSettings
    });
    
    if (success) {
      toast.success("Notification settings saved");
    } else {
      toast.error("Failed to save notification settings");
    }
    
    setIsLoading(false);
  };

  const handleSaveAppSettings = async () => {
    setIsLoading(true);
    
    const success = await saveSettingsToSupabase({
      ...userSettings,
      language: appSettings.language,
      timezone: appSettings.timezone,
      currency: appSettings.currency,
      company_details: appSettings.companyDetails
    });
    
    if (success) {
      toast.success("App settings saved");
    } else {
      toast.error("Failed to save app settings");
    }
    
    setIsLoading(false);
  };

  const handleDownloadSubscriptionsReport = () => {
    setIsReportLoading(true);
    try {
      downloadSubscriptionsReport(subscriptions, customers, platforms);
      toast.success("Subscriptions report downloaded");
    } catch (error) {
      toast.error("Failed to download report");
      console.error(error);
    } finally {
      setIsReportLoading(false);
    }
  };

  const handleDownloadCustomersReport = () => {
    setIsReportLoading(true);
    try {
      downloadCustomersReport(customers, subscriptions);
      toast.success("Customers report downloaded");
    } catch (error) {
      toast.error("Failed to download report");
      console.error(error);
    } finally {
      setIsReportLoading(false);
    }
  };

  const handleDownloadPlatformsReport = () => {
    setIsReportLoading(true);
    try {
      downloadPlatformsReport(platforms, subscriptions);
      toast.success("Platforms report downloaded");
    } catch (error) {
      toast.error("Failed to download report");
      console.error(error);
    } finally {
      setIsReportLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security">
            <Lock className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="app">
            <SettingsIcon className="h-4 w-4 mr-2" />
            App Settings
          </TabsTrigger>
          <TabsTrigger value="reports">
            <Download className="h-4 w-4 mr-2" />
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={profileForm.name}
                    onChange={handleProfileFormChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={profileForm.email}
                    onChange={handleProfileFormChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={profileForm.phone}
                    onChange={handleProfileFormChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    name="company"
                    value={profileForm.company}
                    onChange={handleProfileFormChange}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveProfile} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose what alerts and notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Receive email notifications about important events
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="email-notifications">
                      {notificationSettings.emailAlerts ? "On" : "Off"}
                    </Label>
                    <Switch
                      id="email-notifications"
                      checked={notificationSettings.emailAlerts}
                      onCheckedChange={(checked) => handleNotificationChange("emailAlerts", checked)}
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Expiry Reminders</p>
                    <p className="text-sm text-muted-foreground">
                      Get notified before subscriptions expire
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="expiry-reminders">
                      {notificationSettings.expiryReminders ? "On" : "Off"}
                    </Label>
                    <Switch
                      id="expiry-reminders"
                      checked={notificationSettings.expiryReminders}
                      onCheckedChange={(checked) => handleNotificationChange("expiryReminders", checked)}
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Payment Reminders</p>
                    <p className="text-sm text-muted-foreground">
                      Get notified about upcoming payments
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="payment-reminders">
                      {notificationSettings.paymentReminders ? "On" : "Off"}
                    </Label>
                    <Switch
                      id="payment-reminders"
                      checked={notificationSettings.paymentReminders}
                      onCheckedChange={(checked) => handleNotificationChange("paymentReminders", checked)}
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Marketing Emails</p>
                    <p className="text-sm text-muted-foreground">
                      Receive updates about new features and offers
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="marketing-emails">
                      {notificationSettings.marketingEmails ? "On" : "Off"}
                    </Label>
                    <Switch
                      id="marketing-emails"
                      checked={notificationSettings.marketingEmails}
                      onCheckedChange={(checked) => handleNotificationChange("marketingEmails", checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveNotifications} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Preferences
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your password and security preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input id="confirm-password" type="password" />
                </div>
              </div>
              <div className="pt-4 border-t">
                <h3 className="font-medium mb-2">Two-Factor Authentication</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Add an additional layer of security to your account
                    </p>
                  </div>
                  <Button variant="outline">Configure</Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button>Change Password</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="app">
          <Card>
            <CardHeader>
              <CardTitle>Application Settings</CardTitle>
              <CardDescription>
                Customize your application experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select 
                  value={appSettings.language}
                  onValueChange={(value) => handleAppSettingChange("language", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ne">Nepali</SelectItem>
                    <SelectItem value="hi">Hindi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select 
                  value={appSettings.timezone}
                  onValueChange={(value) => handleAppSettingChange("timezone", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Kathmandu">Nepal Time (UTC+5:45)</SelectItem>
                    <SelectItem value="Asia/Kolkata">India Time (UTC+5:30)</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select 
                  value={appSettings.currency}
                  onValueChange={(value) => handleAppSettingChange("currency", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NPR">Nepali Rupee (₹)</SelectItem>
                    <SelectItem value="INR">Indian Rupee (₹)</SelectItem>
                    <SelectItem value="USD">US Dollar ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-details">Company Details</Label>
                <Textarea
                  id="company-details"
                  placeholder="Enter your company details"
                  rows={3}
                  value={appSettings.companyDetails}
                  onChange={handleTextAreaChange}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveAppSettings} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Globe className="mr-2 h-4 w-4" />
                    Save Settings
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Download Reports</CardTitle>
              <CardDescription>
                Export your data to CSV for analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <h3 className="font-medium">Subscriptions Report</h3>
                  <p className="text-sm text-muted-foreground">
                    Export all subscription data including customer and platform information
                  </p>
                  <Button 
                    variant="outline"
                    onClick={handleDownloadSubscriptionsReport}
                    disabled={isReportLoading}
                    className="w-full sm:w-auto"
                  >
                    {isReportLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Download Subscriptions Report
                  </Button>
                </div>

                <div className="flex flex-col gap-2">
                  <h3 className="font-medium">Customers Report</h3>
                  <p className="text-sm text-muted-foreground">
                    Export customer data with subscription counts
                  </p>
                  <Button 
                    variant="outline"
                    onClick={handleDownloadCustomersReport}
                    disabled={isReportLoading}
                    className="w-full sm:w-auto"
                  >
                    {isReportLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Download Customers Report
                  </Button>
                </div>

                <div className="flex flex-col gap-2">
                  <h3 className="font-medium">Platforms Report</h3>
                  <p className="text-sm text-muted-foreground">
                    Export platform data with subscription counts
                  </p>
                  <Button 
                    variant="outline"
                    onClick={handleDownloadPlatformsReport}
                    disabled={isReportLoading}
                    className="w-full sm:w-auto"
                  >
                    {isReportLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Download Platforms Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
