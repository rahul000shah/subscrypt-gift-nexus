
import { useState } from "react";
import { useData, Subscription } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Calendar,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  CreditCard,
  Filter,
  Clock,
  Calendar as CalendarIcon
} from "lucide-react";
import { format, parseISO, addMonths, addYears } from "date-fns";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const Subscriptions = () => {
  const { customers, platforms, subscriptions, addSubscription, updateSubscription, deleteSubscription } = useData();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [platformFilter, setPlatformFilter] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [formData, setFormData] = useState({
    customer_id: "",
    platform_id: "",
    type: "",
    start_date: new Date().toISOString(),
    expiry_date: new Date().toISOString(),
    cost: 0,
    status: "active" as "active" | "expired" | "pending" | "cancelled",
    notes: ""
  });

  // Filter subscriptions based on search query and filters
  const filteredSubscriptions = subscriptions.filter(subscription => {
    const customer = customers.find(c => c.id === subscription.customer_id);
    const platform = platforms.find(p => p.id === subscription.platform_id);
    
    if (!customer || !platform) return false;
    
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      customer.name.toLowerCase().includes(query) ||
      platform.name.toLowerCase().includes(query) ||
      subscription.type.toLowerCase().includes(query) ||
      subscription.notes.toLowerCase().includes(query);
    
    let matchesStatus = true;
    if (statusFilter) {
      matchesStatus = subscription.status === statusFilter;
    }
    
    let matchesPlatform = true;
    if (platformFilter) {
      matchesPlatform = subscription.platform_id === platformFilter;
    }
    
    return matchesSearch && matchesStatus && matchesPlatform;
  });

  // Stats
  const statusCounts = {
    active: subscriptions.filter(s => s.status === "active").length,
    expired: subscriptions.filter(s => s.status === "expired").length,
    pending: subscriptions.filter(s => s.status === "pending").length,
    cancelled: subscriptions.filter(s => s.status === "cancelled").length,
  };

  // Calculate subscription revenue
  const activeRevenue = subscriptions
    .filter(s => s.status === "active")
    .reduce((sum, sub) => sum + sub.cost, 0);

  const handleOpenAddDialog = () => {
    // Reset form and set default dates
    const startDate = new Date();
    const expiryDate = addMonths(startDate, 1); // Default to 1 month
    
    setFormData({
      customer_id: "",
      platform_id: "",
      type: "Monthly",
      start_date: startDate.toISOString(),
      expiry_date: expiryDate.toISOString(),
      cost: 999,
      status: "active",
      notes: ""
    });
    
    setIsAddDialogOpen(true);
  };

  const handleOpenEditDialog = (subscription: Subscription) => {
    setCurrentSubscription(subscription);
    setFormData({
      customer_id: subscription.customer_id,
      platform_id: subscription.platform_id,
      type: subscription.type,
      start_date: subscription.start_date,
      expiry_date: subscription.expiry_date,
      cost: subscription.cost,
      status: subscription.status as "active" | "expired" | "pending" | "cancelled",
      notes: subscription.notes
    });
    setIsEditDialogOpen(true);
  };

  const handleOpenDeleteDialog = (subscription: Subscription) => {
    setCurrentSubscription(subscription);
    setIsDeleteDialogOpen(true);
  };

  const calculateExpiryDate = (startDate: Date, type: string) => {
    switch (type) {
      case "Monthly":
        return addMonths(startDate, 1);
      case "Quarterly":
        return addMonths(startDate, 3);
      case "Semi-Annual":
        return addMonths(startDate, 6);
      case "Annual":
        return addYears(startDate, 1);
      case "2 Year":
        return addYears(startDate, 2);
      case "3 Year":
        return addYears(startDate, 3);
      default:
        // For gift cards or custom types
        return addYears(startDate, 1);
    }
  };

  const handleAddSubscription = async () => {
    if (!formData.customer_id) return toast.error("Please select a customer");
    if (!formData.platform_id) return toast.error("Please select a platform");
    if (!formData.type) return toast.error("Please enter a subscription type");
    if (!formData.start_date) return toast.error("Please select a start date");
    if (!formData.expiry_date) return toast.error("Please select an expiry date");
    if (formData.cost <= 0) return toast.error("Cost must be greater than 0");
    
    setIsLoading(true);
    try {
      await addSubscription(formData);
      setIsAddDialogOpen(false);
      toast.success("Subscription added successfully");
    } catch (error) {
      console.error("Failed to add subscription:", error);
      toast.error("Failed to add subscription");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSubscription = async () => {
    if (!currentSubscription) return;
    
    if (!formData.customer_id) return toast.error("Please select a customer");
    if (!formData.platform_id) return toast.error("Please select a platform");
    if (!formData.type) return toast.error("Please enter a subscription type");
    if (!formData.start_date) return toast.error("Please select a start date");
    if (!formData.expiry_date) return toast.error("Please select an expiry date");
    if (formData.cost <= 0) return toast.error("Cost must be greater than 0");
    
    setIsLoading(true);
    try {
      await updateSubscription(currentSubscription.id, formData);
      setIsEditDialogOpen(false);
      toast.success("Subscription updated successfully");
    } catch (error) {
      console.error("Failed to update subscription:", error);
      toast.error("Failed to update subscription");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSubscription = async () => {
    if (!currentSubscription) return;
    
    setIsLoading(true);
    try {
      await deleteSubscription(currentSubscription.id);
      setIsDeleteDialogOpen(false);
      toast.success("Subscription deleted successfully");
    } catch (error) {
      console.error("Failed to delete subscription:", error);
      toast.error("Failed to delete subscription");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === "cost" ? Number(value) : value 
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Auto-calculate expiry date when type changes
    if (name === "type") {
      const startDate = parseISO(formData.start_date);
      const expiryDate = calculateExpiryDate(startDate, value);
      setFormData(prev => ({
        ...prev,
        type: value,
        expiry_date: expiryDate.toISOString()
      }));
    }
    
    // Auto-calculate expiry date when start date changes
    if (name === "start_date") {
      const startDate = new Date(value);
      const expiryDate = calculateExpiryDate(startDate, formData.type);
      setFormData(prev => ({
        ...prev,
        start_date: value,
        expiry_date: expiryDate.toISOString()
      }));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "expired":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-amber-500" />;
      case "cancelled":
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Active";
      case "expired":
        return "Expired";
      case "pending":
        return "Pending";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100";
      case "expired":
        return "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100";
      case "pending":
        return "bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100";
      case "cancelled":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
          <p className="text-muted-foreground">
            Manage all subscriptions and gift cards
          </p>
        </div>
        <Button onClick={handleOpenAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Subscription
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                <span className="text-2xl font-bold">{statusCounts.active}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {Math.round(statusCounts.active / subscriptions.length * 100)}% of total
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-amber-500" />
                <span className="text-2xl font-bold">{statusCounts.pending}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {Math.round(statusCounts.pending / subscriptions.length * 100)}% of total
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expired</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <XCircle className="h-5 w-5 mr-2 text-red-500" />
                <span className="text-2xl font-bold">{statusCounts.expired}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {Math.round(statusCounts.expired / subscriptions.length * 100)}% of total
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-primary" />
              <span className="text-2xl font-bold">₹{activeRevenue.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search subscriptions..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Select
          value={statusFilter || ""}
          onValueChange={(value) => setStatusFilter(value === "" ? null : value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={platformFilter || ""}
          onValueChange={(value) => setPlatformFilter(value === "" ? null : value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Platforms</SelectItem>
            {platforms.map((platform) => (
              <SelectItem key={platform.id} value={platform.id}>
                {platform.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Subscriptions Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="hidden md:table-cell">Start Date</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubscriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <CreditCard className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">No subscriptions found</p>
                  {(searchQuery || statusFilter || platformFilter) && (
                    <Button 
                      variant="link" 
                      onClick={() => {
                        setSearchQuery("");
                        setStatusFilter(null);
                        setPlatformFilter(null);
                      }}
                      className="mt-2"
                    >
                      Clear filters
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredSubscriptions.map((subscription) => {
                const customer = customers.find(c => c.id === subscription.customer_id);
                const platform = platforms.find(p => p.id === subscription.platform_id);
                
                if (!customer || !platform) return null;
                
                return (
                  <TableRow key={subscription.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{platform.name}</TableCell>
                    <TableCell>{subscription.type}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {format(parseISO(subscription.start_date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      {format(parseISO(subscription.expiry_date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>₹{subscription.cost.toLocaleString()}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center w-fit ${getStatusClass(subscription.status)}`}>
                        {getStatusIcon(subscription.status)}
                        <span className="ml-1">{getStatusText(subscription.status)}</span>
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleOpenEditDialog(subscription)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteSubscription(subscription)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Subscription Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Subscription</DialogTitle>
            <DialogDescription>
              Create a new subscription or gift card.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="customer_id">Customer *</Label>
              <Select 
                value={formData.customer_id}
                onValueChange={(value) => handleSelectChange("customer_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="platform_id">Platform *</Label>
              <Select 
                value={formData.platform_id}
                onValueChange={(value) => handleSelectChange("platform_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map((platform) => (
                    <SelectItem key={platform.id} value={platform.id}>
                      {platform.name} ({platform.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Subscription Type *</Label>
                <Select 
                  value={formData.type}
                  onValueChange={(value) => handleSelectChange("type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Regular Subscriptions</SelectLabel>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                      <SelectItem value="Quarterly">Quarterly (3 months)</SelectItem>
                      <SelectItem value="Semi-Annual">Semi-Annual (6 months)</SelectItem>
                      <SelectItem value="Annual">Annual</SelectItem>
                      <SelectItem value="2 Year">2 Year</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Gift Cards</SelectLabel>
                      <SelectItem value="Gift Card">Gift Card</SelectItem>
                      <SelectItem value="1-Month Gift">1-Month Gift</SelectItem>
                      <SelectItem value="3-Month Gift">3-Month Gift</SelectItem>
                      <SelectItem value="6-Month Gift">6-Month Gift</SelectItem>
                      <SelectItem value="1-Year Gift">1-Year Gift</SelectItem>
                    </SelectGroup>
                    <SelectItem value="Custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status *</Label>
                <Select 
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange("status", value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Start Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.start_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.start_date ? format(parseISO(formData.start_date), "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={parseISO(formData.start_date)}
                      onSelect={(date) => date && handleSelectChange("start_date", date.toISOString())}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label>Expiry Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.expiry_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.expiry_date ? format(parseISO(formData.expiry_date), "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={parseISO(formData.expiry_date)}
                      onSelect={(date) => date && setFormData(prev => ({ ...prev, expiry_date: date.toISOString() }))}
                      initialFocus
                      disabled={(date) => date < parseISO(formData.start_date)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cost">Cost (₹) *</Label>
              <Input
                id="cost"
                name="cost"
                type="number"
                value={formData.cost}
                onChange={handleInputChange}
                placeholder="999"
                min="0"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Additional information..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSubscription} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Subscription"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Subscription Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Subscription</DialogTitle>
            <DialogDescription>
              Update subscription information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-customer_id">Customer *</Label>
              <Select 
                value={formData.customer_id}
                onValueChange={(value) => handleSelectChange("customer_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-platform_id">Platform *</Label>
              <Select 
                value={formData.platform_id}
                onValueChange={(value) => handleSelectChange("platform_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map((platform) => (
                    <SelectItem key={platform.id} value={platform.id}>
                      {platform.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-type">Subscription Type *</Label>
                <Input
                  id="edit-type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-status">Status *</Label>
                <Select 
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange("status", value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Start Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.start_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.start_date ? format(parseISO(formData.start_date), "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={parseISO(formData.start_date)}
                      onSelect={(date) => date && handleSelectChange("start_date", date.toISOString())}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label>Expiry Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.expiry_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.expiry_date ? format(parseISO(formData.expiry_date), "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={parseISO(formData.expiry_date)}
                      onSelect={(date) => date && setFormData(prev => ({ ...prev, expiry_date: date.toISOString() }))}
                      initialFocus
                      disabled={(date) => date < parseISO(formData.start_date)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-cost">Cost (₹) *</Label>
              <Input
                id="edit-cost"
                name="cost"
                type="number"
                value={formData.cost}
                onChange={handleInputChange}
                min="0"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSubscription} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Subscription Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this subscription? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteSubscription}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Subscriptions;
