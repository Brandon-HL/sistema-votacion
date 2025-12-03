import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { apiClient } from "@/integrations/api/client";

type UserRole = "admin" | "supervisor" | "voter";
type UserStatus = "pending" | "active" | "suspended";

interface Profile {
  id: string;
  dni: string;
  full_name: string;
  phone: string | null;
  age: number | null;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  profile: Profile | null;
  loading: boolean;
  signIn: (dni: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (data: SignUpData) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

interface SignUpData {
  dni: string;
  password: string;
  full_name: string;
  phone: string;
  age: number;
  role: "supervisor" | "voter";
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const profileData = await apiClient.getProfile();
      return profileData as Profile;
    } catch (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
  };

  useEffect(() => {
    // Verificar si hay un token almacenado
    const token = localStorage.getItem('auth_token');
    
    if (token) {
      // Intentar obtener el perfil con el token
      fetchProfile().then((profileData) => {
        setProfile(profileData);
        setLoading(false);
      }).catch(() => {
        // Si falla, limpiar el token
        localStorage.removeItem('auth_token');
        apiClient.setToken(null);
        setProfile(null);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const signIn = async (dni: string, password: string) => {
    try {
      const response = await apiClient.signIn(dni, password);
      setProfile(response.user);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (data: SignUpData) => {
    try {
      await apiClient.signUp(data);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    apiClient.setToken(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
