
import { useState } from "react";
import { useData, Platform } from "@/context/DataContext";
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
  SelectLabel,
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
  CreditCard, 
  Image,
  Loader2,
  Layers
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

const Platforms = () => {
  const { platforms, subscriptions, addPlatform, updatePlatform, deletePlatform } = useData();

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [currentPlatform, setCurrentPlatform] = useState<Platform | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "subscription" as "subscription" | "gift_card",
    description: "",
    logo_url: ""
  });

  const filteredPlatforms = platforms.filter(platform => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = platform.name.toLowerCase().includes(query) || 
                         platform.description.toLowerCase().includes(query);
    
    if (typeFilter) {
      return matchesSearch && platform.type === typeFilter;
    }
    
    return matchesSearch;
  });

  const handleOpenEditDialog = (platform: Platform) => {
    setCurrentPlatform(platform);
    setFormData({
      name: platform.name,
      type: platform.type,
      description: platform.description,
      logo_url: platform.logo_url
    });
    setIsEditDialogOpen(true);
  };

  const handleOpenDeleteDialog = (platform: Platform) => {
    setCurrentPlatform(platform);
    setIsDeleteDialogOpen(true);
  };

  const handleAddPlatform = async () => {
    if (!formData.name) {
      toast.error("Platform name is required");
      return;
    }
    
    setIsLoading(true);
    try {
      await addPlatform(formData);
      setIsAddDialogOpen(false);
      resetForm();
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePlatform = async () => {
    if (!currentPlatform) return;
    
    if (!formData.name) {
      toast.error("Platform name is required");
      return;
    }
    
    setIsLoading(true);
    try {
      await updatePlatform(currentPlatform.id, formData);
      setIsEditDialogOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePlatform = async () => {
    if (!currentPlatform) return;
    
    // Check if platform has subscriptions
    const platformSubs = subscriptions.filter(sub => sub.platform_id === currentPlatform.id);
    if (platformSubs.length > 0) {
      toast.error("Cannot delete platform with active subscriptions");
      setIsDeleteDialogOpen(false);
      return;
    }
    
    setIsLoading(true);
    try {
      await deletePlatform(currentPlatform.id);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      // Error is handled in context
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "subscription",
      description: "",
      logo_url: ""
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      type: value as "subscription" | "gift_card" 
    }));
  };

  const getPlatformSubscriptionCount = (platformId: string) => {
    return subscriptions.filter(sub => sub.platform_id === platformId).length;
  };

  const getTypeLabel = (type: string) => {
    return type === "subscription" ? "Subscription" : "Gift Card";
  };

  const getTypeColor = (type: string) => {
    return type === "subscription" 
      ? "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100" 
      : "bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Platforms</h1>
          <p className="text-muted-foreground">
            Manage your subscription platforms and gift cards
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Platform
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Platform</DialogTitle>
              <DialogDescription>
                Enter platform details to add it to your system.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Platform Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Netflix"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Platform Type *</Label>
                <Select 
                  value={formData.type}
                  onValueChange={handleTypeChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="subscription">Subscription</SelectItem>
                      <SelectItem value="gift_card">Gift Card</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Stream movies & TV shows"
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="logo_url">Logo URL</Label>
                <Input
                  id="logo_url"
                  name="logo_url"
                  value={formData.logo_url}
                  onChange={handleInputChange}
                  placeholder="https://example.com/logo.png"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddPlatform} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Platform"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search platforms..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select
          value={typeFilter || ""}
          onValueChange={(value) => setTypeFilter(value === "" ? null : value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Types</SelectItem>
            <SelectItem value="subscription">Subscription</SelectItem>
            <SelectItem value="gift_card">Gift Card</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Platform Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Logo</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead className="hidden md:table-cell">Description</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Subscriptions</TableHead>
              <TableHead className="hidden sm:table-cell">Added On</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPlatforms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Layers className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">No platforms found</p>
                  {(searchQuery || typeFilter) && (
                    <Button 
                      variant="link" 
                      onClick={() => {
                        setSearchQuery("");
                        setTypeFilter(null);
                      }}
                      className="mt-2"
                    >
                      Clear filters
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredPlatforms.map((platform) => {
                const subscriptionCount = getPlatformSubscriptionCount(platform.id);
                
                return (
                  <TableRow key={platform.id}>
                    <TableCell>
                      {platform.logo_url ? (
                        <img 
                          src={platform.logo_url} 
                          alt={platform.name} 
                          className="w-8 h-8 object-contain" 
                        />
                      ) : (
                        <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                          <Image className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{platform.name}</TableCell>
                    <TableCell className="hidden md:table-cell max-w-[300px] truncate">
                      {platform.description || "-"}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getTypeColor(platform.type)}`}>
                        {getTypeLabel(platform.type)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <CreditCard className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{subscriptionCount}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {format(parseISO(platform.created_at), 'MMM d, yyyy')}
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
                          <DropdownMenuItem onClick={() => handleOpenEditDialog(platform)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Platform
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleOpenDeleteDialog(platform)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Platform
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

      {/* Edit Platform Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Platform</DialogTitle>
            <DialogDescription>
              Update platform information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Platform Name *</Label>
              <Input
                id="edit-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-type">Platform Type *</Label>
              <Select 
                value={formData.type}
                onValueChange={handleTypeChange}
              >
                <SelectTrigger id="edit-type">
                  <SelectValue placeholder="Select platform type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="subscription">Subscription</SelectItem>
                    <SelectItem value="gift_card">Gift Card</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-logo_url">Logo URL</Label>
              <Input
                id="edit-logo_url"
                name="logo_url"
                value={formData.logo_url}
                onChange={handleInputChange}
              />
              {formData.logo_url && (
                <div className="mt-2 flex justify-center">
                  <img
                    src={formData.logo_url}
                    alt="Logo Preview"
                    className="h-20 w-20 object-contain border rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80?text=Error';
                    }}
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePlatform} disabled={isLoading}>
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

      {/* Delete Platform Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Platform</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this platform? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeletePlatform}
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

export default Platforms;
