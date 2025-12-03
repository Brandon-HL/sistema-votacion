import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Vote, Calendar, Users, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/integrations/api/client";
import { MeshBackground } from "@/components/layout/MeshBackground";
import { Header } from "@/components/layout/Header";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Poll {
  id: number;
  title: string;
  description: string | null;
  end_date: string;
  min_age: number | null;
  is_active: boolean;
}

interface UserVote {
  poll_id: number;
}

export default function VoterDashboard() {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [userVotes, setUserVotes] = useState<UserVote[]>([]);
  const [loadingPolls, setLoadingPolls] = useState(true);

  useEffect(() => {
    if (!loading && !profile) {
      navigate("/auth");
      return;
    }
    if (!loading && profile && profile.role !== "voter") {
      navigate(`/${profile.role}`);
      return;
    }
    if (!loading && profile && profile.status !== "active") {
      navigate("/auth");
      return;
    }
  }, [profile, loading, navigate]);

  useEffect(() => {
    if (profile) {
      fetchPolls();
      fetchUserVotes();
    }
  }, [profile]);

  const fetchPolls = async () => {
    try {
      setLoadingPolls(true);
      const data = await apiClient.getPolls();
      
      // Filter by age if user has age set
      const filtered = data.filter((poll: Poll) => {
        if (!poll.min_age || !profile?.age) return true;
        return profile.age >= poll.min_age;
      });
      setPolls(filtered);
    } catch (error) {
      console.error("Error fetching polls:", error);
    } finally {
      setLoadingPolls(false);
    }
  };

  const fetchUserVotes = async () => {
    if (!profile) return;
    try {
      const data = await apiClient.getUserVotes();
      setUserVotes(data);
    } catch (error) {
      console.error("Error fetching user votes:", error);
    }
  };

  const hasVoted = (pollId: number) => {
    return userVotes.some((v) => v.poll_id === pollId);
  };

  if (loading || loadingPolls) {
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
          <h1 className="font-serif text-4xl font-bold text-foreground mb-2">
            Panel del Votante
          </h1>
          <p className="text-muted-foreground">
            Participa en las votaciones activas de tu municipio
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          <Card variant="glass">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Vote className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{polls.length}</p>
                  <p className="text-sm text-muted-foreground">Encuestas Activas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-500/10">
                  <CheckCircle className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{userVotes.length}</p>
                  <p className="text-sm text-muted-foreground">Votos Emitidos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-accent/10">
                  <Clock className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{polls.length - userVotes.length}</p>
                  <p className="text-sm text-muted-foreground">Pendientes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Polls Grid */}
        <h2 className="font-serif text-2xl font-semibold mb-4">Votaciones Disponibles</h2>
        {polls.length === 0 ? (
          <Card variant="glass" className="text-center py-12">
            <CardContent>
              <Vote className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay votaciones activas en este momento</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {polls.map((poll, index) => (
              <motion.div
                key={poll.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Card variant="interactive" className="h-full flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="p-2 rounded-lg bg-primary/10 mb-2">
                        <Vote className="w-5 h-5 text-primary" />
                      </div>
                      {hasVoted(poll.id) && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-600">
                          Votado
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-xl">{poll.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{poll.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-end">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <Calendar className="w-4 h-4" />
                      <span>Cierra: {format(new Date(poll.end_date), "dd MMM yyyy", { locale: es })}</span>
                    </div>
                    <Button
                      className="w-full"
                      variant={hasVoted(poll.id) ? "secondary" : "default"}
                      disabled={hasVoted(poll.id)}
                      onClick={() => navigate(`/vote/${poll.id.toString()}`)}
                    >
                      {hasVoted(poll.id) ? "Ya votaste" : "Votar ahora"}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </MeshBackground>
  );
}
