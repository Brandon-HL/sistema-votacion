import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, User, PartyPopper, Calendar, Check } from "lucide-react";
import confetti from "canvas-confetti";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { MeshBackground } from "@/components/layout/MeshBackground";
import { Header } from "@/components/layout/Header";
import { useToast } from "@/hooks/use-toast";

interface Poll {
  id: string;
  title: string;
  description: string | null;
}

interface Candidate {
  id: string;
  name: string;
  party: string;
  photo_url: string | null;
  age: number | null;
  description: string | null;
}

export default function VotePage() {
  const { pollId } = useParams<{ pollId: string }>();
  const { profile, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [poll, setPoll] = useState<Poll | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    if (!loading && !profile) {
      navigate("/auth");
      return;
    }
    if (!loading && profile && profile.role !== "voter") {
      navigate(`/${profile.role}`);
    }
  }, [profile, loading, navigate]);

  useEffect(() => {
    if (pollId && profile) {
      fetchPollData();
      checkIfVoted();
    }
  }, [pollId, profile]);

  const fetchPollData = async () => {
    const { data: pollData } = await supabase
      .from("polls")
      .select("*")
      .eq("id", pollId)
      .single();

    if (pollData) {
      setPoll(pollData);
    }

    const { data: candidatesData } = await supabase
      .from("candidates")
      .select("*")
      .eq("poll_id", pollId);

    if (candidatesData) {
      setCandidates(candidatesData);
    }
  };

  const checkIfVoted = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from("votes")
      .select("id")
      .eq("poll_id", pollId)
      .eq("user_id", profile.id)
      .maybeSingle();

    if (data) {
      setHasVoted(true);
    }
  };

  const handleVote = async () => {
    if (!selectedCandidate || !profile || !pollId) return;
    
    setSubmitting(true);
    const { error } = await supabase.from("votes").insert({
      poll_id: pollId,
      candidate_id: selectedCandidate.id,
      user_id: profile.id,
    });

    setSubmitting(false);
    setConfirmOpen(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error al votar",
        description: error.message.includes("unique") 
          ? "Ya has votado en esta encuesta" 
          : error.message,
      });
      return;
    }

    // Fire confetti!
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ["#6366f1", "#a855f7", "#22d3ee", "#f472b6"],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ["#6366f1", "#a855f7", "#22d3ee", "#f472b6"],
      });
    }, 250);

    setSuccessOpen(true);
  };

  if (loading || !poll) {
    return (
      <MeshBackground>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Cargando...</div>
        </div>
      </MeshBackground>
    );
  }

  if (hasVoted) {
    return (
      <MeshBackground>
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Card variant="glass" className="max-w-md mx-auto text-center py-12">
            <CardContent>
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-emerald-500" />
              </div>
              <h2 className="font-serif text-2xl font-bold mb-2">Ya has votado</h2>
              <p className="text-muted-foreground mb-6">Ya emitiste tu voto en esta encuesta</p>
              <Button onClick={() => navigate("/voter")}>Volver al inicio</Button>
            </CardContent>
          </Card>
        </main>
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
        >
          <Button variant="ghost" onClick={() => navigate("/voter")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>

          <div className="mb-8">
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-2">
              {poll.title}
            </h1>
            <p className="text-muted-foreground">{poll.description}</p>
          </div>

          <h2 className="font-serif text-xl font-semibold mb-4">Selecciona un candidato</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {candidates.map((candidate, index) => (
              <motion.div
                key={candidate.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Card
                  variant="interactive"
                  className={`h-full transition-all ${
                    selectedCandidate?.id === candidate.id
                      ? "ring-2 ring-primary ring-offset-2 bg-primary/5"
                      : ""
                  }`}
                  onClick={() => setSelectedCandidate(candidate)}
                >
                  <CardHeader className="text-center pb-2">
                    <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden bg-muted">
                      {candidate.photo_url ? (
                        <img
                          src={candidate.photo_url}
                          alt={candidate.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <CardTitle className="text-xl">{candidate.name}</CardTitle>
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <PartyPopper className="w-4 h-4" />
                      <span>{candidate.party}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="text-center">
                    {candidate.age && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {candidate.age} años
                      </p>
                    )}
                    {candidate.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {candidate.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {selectedCandidate && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t"
            >
              <div className="container mx-auto flex items-center justify-between">
                <p className="text-sm">
                  Seleccionado: <strong>{selectedCandidate.name}</strong>
                </p>
                <Button variant="hero" size="lg" onClick={() => setConfirmOpen(true)}>
                  Confirmar voto
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Confirmation Dialog */}
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent className="glass-card border-white/60">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">Confirmar tu voto</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que deseas votar por{" "}
                <strong>{selectedCandidate?.name}</strong>?
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-4 py-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex-shrink-0">
                {selectedCandidate?.photo_url ? (
                  <img
                    src={selectedCandidate.photo_url}
                    alt={selectedCandidate.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div>
                <p className="font-semibold">{selectedCandidate?.name}</p>
                <p className="text-sm text-muted-foreground">{selectedCandidate?.party}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Esta acción no se puede deshacer. Tu voto es confidencial y seguro.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                Cancelar
              </Button>
              <Button variant="hero" onClick={handleVote} disabled={submitting}>
                {submitting ? "Enviando..." : "Confirmar voto"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Success Dialog */}
        <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
          <DialogContent className="glass-card border-white/60 text-center">
            <div className="py-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6"
              >
                <Check className="w-10 h-10 text-emerald-500" />
              </motion.div>
              <DialogTitle className="font-serif text-3xl mb-2">¡Voto registrado!</DialogTitle>
              <DialogDescription className="text-base">
                Tu voto ha sido registrado exitosamente. Gracias por participar en el proceso democrático.
              </DialogDescription>
            </div>
            <DialogFooter className="justify-center">
              <Button variant="hero" size="lg" onClick={() => navigate("/voter")}>
                Volver al inicio
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </MeshBackground>
  );
}
