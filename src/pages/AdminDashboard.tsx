import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Users, Vote, CheckCircle, XCircle, Ban, UserCheck, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { MeshBackground } from "@/components/layout/MeshBackground";
import { Header } from "@/components/layout/Header";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Profile {
  id: string;
  dni: string;
  full_name: string;
  phone: string | null;
  age: number | null;
  role: "admin" | "supervisor" | "voter";
  status: "pending" | "active" | "suspended";
  created_at: string;
}

interface Poll {
  id: string;
  title: string;
  description: string | null;
  end_date: string;
  is_active: boolean;
  created_by: string;
  profiles?: { full_name: string } | null;
}

export default function AdminDashboard() {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [pendingUsers, setPendingUsers] = useState<Profile[]>([]);
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [allPolls, setAllPolls] = useState<Poll[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !profile) {
      navigate("/auth");
      return;
    }
    if (!loading && profile && profile.role !== "admin") {
      navigate(`/${profile.role}`);
    }
  }, [profile, loading, navigate]);

  useEffect(() => {
    if (profile && profile.role === "admin") {
      fetchData();
    }
  }, [profile]);

  const fetchData = async () => {
    // Fetch pending supervisors
    const { data: pending } = await supabase
      .from("profiles")
      .select("*")
      .eq("status", "pending")
      .eq("role", "supervisor");

    if (pending) setPendingUsers(pending as Profile[]);

    // Fetch all users (except current admin)
    const { data: users } = await supabase
      .from("profiles")
      .select("*")
      .neq("id", profile?.id)
      .order("created_at", { ascending: false });

    if (users) setAllUsers(users as Profile[]);

    // Fetch all polls
    const { data: polls } = await supabase
      .from("polls")
      .select("*, profiles(full_name)")
      .order("created_at", { ascending: false });

    if (polls) setAllPolls(polls as Poll[]);
    
    setLoadingData(false);
  };

  const updateUserStatus = async (userId: string, status: "active" | "suspended") => {
    const { error } = await supabase
      .from("profiles")
      .update({ status })
      .eq("id", userId);

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      return;
    }

    toast({
      title: status === "active" ? "Usuario aprobado" : "Usuario suspendido",
      description: status === "active" 
        ? "El usuario ahora puede acceder al sistema" 
        : "El usuario ha sido suspendido",
    });
    fetchData();
  };

  const togglePollStatus = async (pollId: string, isActive: boolean) => {
    const { error } = await supabase
      .from("polls")
      .update({ is_active: !isActive })
      .eq("id", pollId);

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      return;
    }

    toast({
      title: isActive ? "Votación desactivada" : "Votación activada",
    });
    fetchData();
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-amber-500/20 text-amber-600",
      active: "bg-emerald-500/20 text-emerald-600",
      suspended: "bg-destructive/20 text-destructive",
    };
    const labels = {
      pending: "Pendiente",
      active: "Activo",
      suspended: "Suspendido",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const styles = {
      admin: "bg-destructive/20 text-destructive",
      supervisor: "bg-accent/20 text-accent",
      voter: "bg-primary/20 text-primary",
    };
    const labels = {
      admin: "Admin",
      supervisor: "Supervisor",
      voter: "Votante",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[role as keyof typeof styles]}`}>
        {labels[role as keyof typeof labels]}
      </span>
    );
  };

  if (loading || loadingData) {
    return (
      <MeshBackground>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Cargando...</div>
        </div>
      </MeshBackground>
    );
  }

  return (
    <MeshBackground>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-destructive/10">
              <Shield className="w-6 h-6 text-destructive" />
            </div>
            <h1 className="font-serif text-4xl font-bold text-foreground">
              Panel de Administración
            </h1>
          </div>
          <p className="text-muted-foreground">
            Gestiona usuarios, aprobaciones y votaciones del sistema
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          <Card variant="glass">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-amber-500/10">
                  <Clock className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingUsers.length}</p>
                  <p className="text-sm text-muted-foreground">Pendientes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{allUsers.filter(u => u.status === "active").length}</p>
                  <p className="text-sm text-muted-foreground">Usuarios Activos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-500/10">
                  <Vote className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{allPolls.filter(p => p.is_active).length}</p>
                  <p className="text-sm text-muted-foreground">Votaciones Activas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-destructive/10">
                  <Ban className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{allUsers.filter(u => u.status === "suspended").length}</p>
                  <p className="text-sm text-muted-foreground">Suspendidos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="bg-white/40 backdrop-blur-xl border border-white/60">
            <TabsTrigger value="pending" className="data-[state=active]:bg-white/60">
              <Clock className="w-4 h-4 mr-2" />
              Aprobaciones ({pendingUsers.length})
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-white/60">
              <Users className="w-4 h-4 mr-2" />
              Usuarios
            </TabsTrigger>
            <TabsTrigger value="polls" className="data-[state=active]:bg-white/60">
              <Vote className="w-4 h-4 mr-2" />
              Votaciones
            </TabsTrigger>
          </TabsList>

          {/* Pending Approvals */}
          <TabsContent value="pending">
            <Card variant="glass">
              <CardHeader>
                <CardTitle>Solicitudes Pendientes</CardTitle>
                <CardDescription>
                  Supervisores que esperan aprobación para acceder al sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <UserCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No hay solicitudes pendientes</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingUsers.map((user, index) => (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * index }}
                        className="flex items-center justify-between p-4 rounded-xl bg-white/30 backdrop-blur-sm"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                            <Users className="w-6 h-6 text-accent" />
                          </div>
                          <div>
                            <p className="font-semibold">{user.full_name}</p>
                            <p className="text-sm text-muted-foreground">
                              DNI: {user.dni} • {user.phone}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Registrado: {format(new Date(user.created_at), "dd MMM yyyy", { locale: es })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => updateUserStatus(user.id, "active")}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Aprobar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => updateUserStatus(user.id, "suspended")}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Rechazar
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Users */}
          <TabsContent value="users">
            <Card variant="glass">
              <CardHeader>
                <CardTitle>Gestión de Usuarios</CardTitle>
                <CardDescription>
                  Lista de todos los usuarios registrados en el sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {allUsers.map((user, index) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.02 * index }}
                      className="flex items-center justify-between p-4 rounded-xl bg-white/30 backdrop-blur-sm"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <Users className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{user.full_name}</p>
                            {getRoleBadge(user.role)}
                            {getStatusBadge(user.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            DNI: {user.dni}
                          </p>
                        </div>
                      </div>
                      <div>
                        {user.status === "active" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateUserStatus(user.id, "suspended")}
                          >
                            <Ban className="w-4 h-4 mr-1" />
                            Suspender
                          </Button>
                        ) : user.status === "suspended" ? (
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => updateUserStatus(user.id, "active")}
                          >
                            <UserCheck className="w-4 h-4 mr-1" />
                            Reactivar
                          </Button>
                        ) : (
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => updateUserStatus(user.id, "active")}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Aprobar
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Polls */}
          <TabsContent value="polls">
            <Card variant="glass">
              <CardHeader>
                <CardTitle>Todas las Votaciones</CardTitle>
                <CardDescription>
                  Gestiona las votaciones de todos los supervisores
                </CardDescription>
              </CardHeader>
              <CardContent>
                {allPolls.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Vote className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No hay votaciones en el sistema</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allPolls.map((poll, index) => (
                      <motion.div
                        key={poll.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.02 * index }}
                        className="flex items-center justify-between p-4 rounded-xl bg-white/30 backdrop-blur-sm"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{poll.title}</p>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              poll.is_active 
                                ? "bg-emerald-500/20 text-emerald-600" 
                                : "bg-muted text-muted-foreground"
                            }`}>
                              {poll.is_active ? "Activa" : "Inactiva"}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Creada por: {poll.profiles?.full_name || "Desconocido"} • 
                            Cierre: {format(new Date(poll.end_date), "dd MMM yyyy", { locale: es })}
                          </p>
                        </div>
                        <Button
                          variant={poll.is_active ? "outline" : "success"}
                          size="sm"
                          onClick={() => togglePollStatus(poll.id, poll.is_active)}
                        >
                          {poll.is_active ? "Desactivar" : "Activar"}
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </MeshBackground>
  );
}
