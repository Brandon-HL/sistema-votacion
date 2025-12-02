import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Vote, Eye, EyeOff, UserPlus, LogIn } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { MeshBackground } from "@/components/layout/MeshBackground";

const loginSchema = z.object({
  dni: z.string().min(6, "DNI debe tener al menos 6 caracteres").max(20),
  password: z.string().min(6, "Contraseña debe tener al menos 6 caracteres"),
});

const signUpSchema = z.object({
  dni: z.string().min(6, "DNI debe tener al menos 6 caracteres").max(20),
  password: z.string().min(6, "Contraseña debe tener al menos 6 caracteres"),
  full_name: z.string().min(2, "Nombre completo requerido"),
  phone: z.string().min(8, "Teléfono inválido"),
  age: z.coerce.number().min(16, "Debes ser mayor de 16 años"),
  role: z.enum(["supervisor", "voter"]),
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignUpFormData = z.infer<typeof signUpSchema>;

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, signUp, profile } = useAuth();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { dni: "", password: "" },
  });

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      dni: "",
      password: "",
      full_name: "",
      phone: "",
      age: 18,
      role: "voter",
    },
  });

  const handleLogin = async (data: LoginFormData) => {
    setLoading(true);
    const { error } = await signIn(data.dni, data.password);
    setLoading(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error al iniciar sesión",
        description: error.message === "Invalid login credentials" 
          ? "DNI o contraseña incorrectos" 
          : error.message,
      });
      return;
    }

    toast({
      title: "¡Bienvenido!",
      description: "Has iniciado sesión correctamente",
    });
  };

  const handleSignUp = async (data: SignUpFormData) => {
    setLoading(true);
    const { error } = await signUp({
      dni: data.dni,
      password: data.password,
      email: `${data.dni}@civicvote.local`,
      full_name: data.full_name,
      phone: data.phone,
      age: data.age,
      role: data.role,
    });
    setLoading(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error al registrarse",
        description: error.message.includes("already registered") 
          ? "Este DNI ya está registrado" 
          : error.message,
      });
      return;
    }

    if (data.role === "supervisor") {
      toast({
        title: "Registro exitoso",
        description: "Tu cuenta está pendiente de aprobación por un administrador.",
      });
      setIsLogin(true);
    } else {
      toast({
        title: "¡Bienvenido!",
        description: "Tu cuenta ha sido creada exitosamente.",
      });
    }
  };

  // Redirect if already logged in
  if (profile) {
    const routes = {
      admin: "/admin",
      supervisor: "/supervisor",
      voter: "/voter",
    };
    navigate(routes[profile.role]);
    return null;
  }

  return (
    <MeshBackground>
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 backdrop-blur-sm mb-4"
            >
              <Vote className="w-10 h-10 text-primary" />
            </motion.div>
            <h1 className="font-serif text-4xl font-bold text-foreground">CivicVote</h1>
            <p className="text-muted-foreground mt-2">Sistema de Votación Municipal</p>
          </div>

          <Card variant="glass" className="overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-white/20">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-4 px-6 text-sm font-medium transition-all ${
                  isLogin
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LogIn className="w-4 h-4 inline mr-2" />
                Iniciar Sesión
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-4 px-6 text-sm font-medium transition-all ${
                  !isLogin
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <UserPlus className="w-4 h-4 inline mr-2" />
                Registrarse
              </button>
            </div>

            <AnimatePresence mode="wait">
              {isLogin ? (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <CardHeader>
                    <CardTitle>Bienvenido de vuelta</CardTitle>
                    <CardDescription>Ingresa tus credenciales para continuar</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="dni">DNI</Label>
                        <Input
                          id="dni"
                          placeholder="Ingresa tu DNI"
                          {...loginForm.register("dni")}
                        />
                        {loginForm.formState.errors.dni && (
                          <p className="text-sm text-destructive">{loginForm.formState.errors.dni.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Contraseña</Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Ingresa tu contraseña"
                            {...loginForm.register("password")}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                        {loginForm.formState.errors.password && (
                          <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>
                        )}
                      </div>
                      <Button type="submit" className="w-full" size="lg" disabled={loading}>
                        {loading ? "Ingresando..." : "Iniciar Sesión"}
                      </Button>
                    </form>
                  </CardContent>
                </motion.div>
              ) : (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <CardHeader>
                    <CardTitle>Crear cuenta</CardTitle>
                    <CardDescription>Completa tus datos para registrarte</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="signup-dni">DNI</Label>
                          <Input
                            id="signup-dni"
                            placeholder="Tu DNI"
                            {...signUpForm.register("dni")}
                          />
                          {signUpForm.formState.errors.dni && (
                            <p className="text-sm text-destructive">{signUpForm.formState.errors.dni.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="age">Edad</Label>
                          <Input
                            id="age"
                            type="number"
                            placeholder="18"
                            {...signUpForm.register("age")}
                          />
                          {signUpForm.formState.errors.age && (
                            <p className="text-sm text-destructive">{signUpForm.formState.errors.age.message}</p>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Nombre Completo</Label>
                        <Input
                          id="full_name"
                          placeholder="Juan Pérez García"
                          {...signUpForm.register("full_name")}
                        />
                        {signUpForm.formState.errors.full_name && (
                          <p className="text-sm text-destructive">{signUpForm.formState.errors.full_name.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Celular</Label>
                        <Input
                          id="phone"
                          placeholder="+51 999 999 999"
                          {...signUpForm.register("phone")}
                        />
                        {signUpForm.formState.errors.phone && (
                          <p className="text-sm text-destructive">{signUpForm.formState.errors.phone.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Tipo de cuenta</Label>
                        <Select
                          defaultValue="voter"
                          onValueChange={(value) => signUpForm.setValue("role", value as "supervisor" | "voter")}
                        >
                          <SelectTrigger className="bg-white/60 backdrop-blur-sm">
                            <SelectValue placeholder="Selecciona tu rol" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="voter">Votante</SelectItem>
                            <SelectItem value="supervisor">Supervisor (requiere aprobación)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Contraseña</Label>
                        <div className="relative">
                          <Input
                            id="signup-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Mínimo 6 caracteres"
                            {...signUpForm.register("password")}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                        {signUpForm.formState.errors.password && (
                          <p className="text-sm text-destructive">{signUpForm.formState.errors.password.message}</p>
                        )}
                      </div>
                      <Button type="submit" className="w-full" size="lg" disabled={loading}>
                        {loading ? "Registrando..." : "Crear cuenta"}
                      </Button>
                    </form>
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
      </div>
    </MeshBackground>
  );
}
