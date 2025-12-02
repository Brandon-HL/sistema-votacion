import { LogOut, Vote, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";

export function Header() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const getRoleBadge = () => {
    if (!profile) return null;
    const colors = {
      admin: "bg-destructive/20 text-destructive",
      supervisor: "bg-accent/20 text-accent",
      voter: "bg-primary/20 text-primary",
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors[profile.role]}`}>
        {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
      </span>
    );
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 w-full"
    >
      <div className="glass-card mx-4 mt-4 md:mx-6">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
              <Vote className="w-5 h-5 text-primary" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-serif text-xl font-semibold text-foreground">CivicVote</h1>
              <p className="text-xs text-muted-foreground">Sistema de Votación Municipal</p>
            </div>
          </div>

          {profile && (
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-3">
                <span className="text-sm font-medium">Hola, {profile.full_name.split(" ")[0]}</span>
                {getRoleBadge()}
              </div>
              
              <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-muted-foreground hover:text-foreground">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.header>
  );
}
