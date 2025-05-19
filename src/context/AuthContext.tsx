
import { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo - in a real app, this would be in your database
const MOCK_USERS = [
  {
    id: "1",
    email: "admin@example.com",
    password: "password123",
    name: "Admin User",
    role: "admin"
  },
  {
    id: "2",
    email: "user@example.com",
    password: "password123",
    name: "Regular User",
    role: "user"
  }
];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem("cms_user");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (error) {
        console.error("Failed to parse stored user data", error);
        localStorage.removeItem("cms_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    // Mock login delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // In a real app, you would make an API call to your authentication service
    const mockUser = MOCK_USERS.find(u => u.email === email && u.password === password);
    
    if (mockUser) {
      const { password: _, ...userWithoutPassword } = mockUser;
      localStorage.setItem("cms_user", JSON.stringify(userWithoutPassword));
      setUser(userWithoutPassword);
      toast.success(`Welcome back, ${userWithoutPassword.name}`);
    } else {
      toast.error("Invalid email or password");
      throw new Error("Invalid email or password");
    }
    
    setIsLoading(false);
  };

  const logout = () => {
    localStorage.removeItem("cms_user");
    setUser(null);
    toast.info("You've been logged out");
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      isLoading, 
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
