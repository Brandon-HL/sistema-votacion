import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Vote, Users, BarChart3, Calendar, Trash2, UserPlus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { MeshBackground } from "@/components/layout/MeshBackground";
import { Header } from "@/components/layout/Header";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface Poll {
  id: string;
  title: string;
  description: string | null;
  end_date: string;
  min_age: number | null;
  is_active: boolean;
}

interface Candidate {
  id: string;
  poll_id: string;
  name: string;
  party: string;
  photo_url: string | null;
  age: number | null;
  description: string | null;
}

interface VoteCount {
  candidate_id: string;
  candidate_name: string;
  count: number;
}

const COLORS = ["#6366f1", "#a855f7", "#22d3ee", "#f472b6", "#84cc16", "#f97316"];

export default function SupervisorDashboard() {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [polls, setPolls] = useState<Poll[]>([]);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [voteCounts, setVoteCounts] = useState<VoteCount[]>([]);
  const [loadingPolls, setLoadingPolls] = useState(true);
  
  // Form states
  const [createPollOpen, setCreatePollOpen] = useState(false);
  const [addCandidateOpen, setAddCandidateOpen] = useState(false);
  const [newPoll, setNewPoll] = useState({ title: "", description: "", end_date: "", min_age: 18 });
  const [newCandidate, setNewCandidate] = useState({ name: "", party: "", photo_url: "", age: 0, description: "" });

  useEffect(() => {
    if (!loading && !profile) {
      navigate("/auth");
      return;
    }
    if (!loading && profile && profile.role !== "supervisor") {
      navigate(`/${profile.role}`);
      return;
    }
    if (!loading && profile && profile.status === "pending") {
      toast({
        variant: "destructive",
        title: "Cuenta pendiente",
        description: "Tu cuenta aún no ha sido aprobada por un administrador.",
      });
      navigate("/auth");
      return;
    }
    if (!loading && profile && profile.status === "suspended") {
      toast({
        variant: "destructive",
        title: "Cuenta suspendida",
        description: "Tu cuenta ha sido suspendida. Contacta al administrador.",
      });
      navigate("/auth");
      return;
    }
  }, [profile, loading, navigate]);

  useEffect(() => {
    if (profile) {
      fetchPolls();
    }
  }, [profile]);

  useEffect(() => {
    if (selectedPoll) {
      fetchCandidates(selectedPoll.id);
      fetchVoteCounts(selectedPoll.id);
      
      // Subscribe to realtime vote updates
      const channel = supabase
        .channel(`votes-${selectedPoll.id}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "votes", filter: `poll_id=eq.${selectedPoll.id}` },
          () => {
            fetchVoteCounts(selectedPoll.id);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedPoll]);

  const fetchPolls = async () => {
    if (!profile) return;
    const { data, error } = await supabase
      .from("polls")
      .select("*")
      .eq("created_by", profile.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPolls(data);
      if (data.length > 0 && !selectedPoll) {
        setSelectedPoll(data[0]);
      }
    }
    setLoadingPolls(false);
  };

  const fetchCandidates = async (pollId: string) => {
    const { data } = await supabase
      .from("candidates")
      .select("*")
      .eq("poll_id", pollId);

    if (data) {
      setCandidates(data);
    }
  };

  const fetchVoteCounts = async (pollId: string) => {
    const { data: votes } = await supabase
      .from("votes")
      .select("candidate_id")
      .eq("poll_id", pollId);

    const { data: candidatesData } = await supabase
      .from("candidates")
      .select("id, name")
      .eq("poll_id", pollId);

    if (votes && candidatesData) {
      const counts = candidatesData.map((c) => ({
        candidate_id: c.id,
        candidate_name: c.name,
        count: votes.filter((v) => v.candidate_id === c.id).length,
      }));
      setVoteCounts(counts);
    }
  };

  const handleCreatePoll = async () => {
    if (!profile) return;
    
    const { error } = await supabase.from("polls").insert({
      title: newPoll.title,
      description: newPoll.description,
      end_date: newPoll.end_date,
      min_age: newPoll.min_age,
      created_by: profile.id,
    });

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      return;
    }

    toast({ title: "Éxito", description: "Votación creada correctamente" });
    setCreatePollOpen(false);
    setNewPoll({ title: "", description: "", end_date: "", min_age: 18 });
    fetchPolls();
  };

  const handleAddCandidate = async () => {
    if (!selectedPoll) return;
    
    const { error } = await supabase.from("candidates").insert({
      poll_id: selectedPoll.id,
      name: newCandidate.name,
      party: newCandidate.party,
      photo_url: newCandidate.photo_url || null,
      age: newCandidate.age || null,
      description: newCandidate.description || null,
    });

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      return;
    }

    toast({ title: "Éxito", description: "Candidato agregado correctamente" });
    setAddCandidateOpen(false);
    setNewCandidate({ name: "", party: "", photo_url: "", age: 0, description: "" });
    fetchCandidates(selectedPoll.id);
    fetchVoteCounts(selectedPoll.id);
  };

  const handleDeleteCandidate = async (candidateId: string) => {
    const { error } = await supabase.from("candidates").delete().eq("id", candidateId);
    
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      return;
    }

    toast({ title: "Candidato eliminado" });
    if (selectedPoll) {
      fetchCandidates(selectedPoll.id);
      fetchVoteCounts(selectedPoll.id);
    }
  };

  const totalVotes = voteCounts.reduce((sum, v) => sum + v.count, 0);

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
          className="flex flex-col md:flex-row md:items-center md:justify-between mb-8"
        >
          <div>
            <h1 className="font-serif text-4xl font-bold text-foreground mb-2">
              Panel del Supervisor
            </h1>
            <p className="text-muted-foreground">
              Gestiona tus votaciones y visualiza resultados en tiempo real
            </p>
          </div>
          <Dialog open={createPollOpen} onOpenChange={setCreatePollOpen}>
            <DialogTrigger asChild>
              <Button variant="hero" size="lg" className="mt-4 md:mt-0">
                <Plus className="w-5 h-5 mr-2" />
                Nueva Votación
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-white/60">
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl">Crear Nueva Votación</DialogTitle>
                <DialogDescription>
                  Completa los datos de la nueva votación
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input
                    value={newPoll.title}
                    onChange={(e) => setNewPoll({ ...newPoll, title: e.target.value })}
                    placeholder="Elección de Alcalde 2024"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Textarea
                    value={newPoll.description}
                    onChange={(e) => setNewPoll({ ...newPoll, description: e.target.value })}
                    placeholder="Descripción de la votación..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fecha de cierre</Label>
                    <Input
                      type="datetime-local"
                      value={newPoll.end_date}
                      onChange={(e) => setNewPoll({ ...newPoll, end_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Edad mínima</Label>
                    <Input
                      type="number"
                      value={newPoll.min_age}
                      onChange={(e) => setNewPoll({ ...newPoll, min_age: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreatePollOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreatePoll}>Crear votación</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </motion.div>

        {polls.length === 0 ? (
          <Card variant="glass" className="text-center py-12">
            <CardContent>
              <Vote className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No tienes votaciones creadas</p>
              <Button onClick={() => setCreatePollOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Crear primera votación
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="bento-grid">
            {/* Poll Selector */}
            <Card variant="glass" className="bento-item-wide">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Vote className="w-5 h-5 text-primary" />
                  Mis Votaciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {polls.map((poll) => (
                    <Button
                      key={poll.id}
                      variant={selectedPoll?.id === poll.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedPoll(poll)}
                    >
                      {poll.title}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Results Chart */}
            {selectedPoll && (
              <>
                <Card variant="glass" className="bento-item-large">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      Resultados: {selectedPoll.title}
                    </CardTitle>
                    <CardDescription>
                      Total de votos: {totalVotes}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {voteCounts.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={voteCounts} layout="vertical">
                          <XAxis type="number" />
                          <YAxis dataKey="candidate_name" type="category" width={100} />
                          <Tooltip
                            contentStyle={{
                              background: "rgba(255,255,255,0.9)",
                              borderRadius: "12px",
                              border: "1px solid rgba(255,255,255,0.6)",
                            }}
                          />
                          <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                            {voteCounts.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        Agrega candidatos para ver resultados
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Stats */}
                <Card variant="glass">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-primary/10">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{candidates.length}</p>
                        <p className="text-sm text-muted-foreground">Candidatos</p>
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
                        <p className="text-2xl font-bold">{totalVotes}</p>
                        <p className="text-sm text-muted-foreground">Votos totales</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card variant="glass">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-accent/10">
                        <Calendar className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {format(new Date(selectedPoll.end_date), "dd MMM yyyy", { locale: es })}
                        </p>
                        <p className="text-sm text-muted-foreground">Fecha de cierre</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Candidates Management */}
                <Card variant="glass" className="bento-item-wide">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        Candidatos
                      </CardTitle>
                      <CardDescription>Gestiona los candidatos de esta votación</CardDescription>
                    </div>
                    <Dialog open={addCandidateOpen} onOpenChange={setAddCandidateOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <UserPlus className="w-4 h-4 mr-2" />
                          Agregar
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="glass-card border-white/60">
                        <DialogHeader>
                          <DialogTitle className="font-serif text-2xl">Agregar Candidato</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Nombre</Label>
                            <Input
                              value={newCandidate.name}
                              onChange={(e) => setNewCandidate({ ...newCandidate, name: e.target.value })}
                              placeholder="Juan Pérez"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Partido</Label>
                            <Input
                              value={newCandidate.party}
                              onChange={(e) => setNewCandidate({ ...newCandidate, party: e.target.value })}
                              placeholder="Partido Ejemplo"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Edad</Label>
                              <Input
                                type="number"
                                value={newCandidate.age}
                                onChange={(e) => setNewCandidate({ ...newCandidate, age: parseInt(e.target.value) })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>URL de foto</Label>
                              <Input
                                value={newCandidate.photo_url}
                                onChange={(e) => setNewCandidate({ ...newCandidate, photo_url: e.target.value })}
                                placeholder="https://..."
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Descripción</Label>
                            <Textarea
                              value={newCandidate.description}
                              onChange={(e) => setNewCandidate({ ...newCandidate, description: e.target.value })}
                              placeholder="Breve descripción del candidato..."
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setAddCandidateOpen(false)}>
                            Cancelar
                          </Button>
                          <Button onClick={handleAddCandidate}>Agregar candidato</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent>
                    {candidates.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        No hay candidatos agregados
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {candidates.map((candidate) => (
                          <div
                            key={candidate.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-white/30 backdrop-blur-sm"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-muted overflow-hidden">
                                {candidate.photo_url ? (
                                  <img
                                    src={candidate.photo_url}
                                    alt={candidate.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Users className="w-5 h-5 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-medium">{candidate.name}</p>
                                <p className="text-sm text-muted-foreground">{candidate.party}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-primary">
                                {voteCounts.find((v) => v.candidate_id === candidate.id)?.count || 0} votos
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteCandidate(candidate.id)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}
      </main>
    </MeshBackground>
  );
}
