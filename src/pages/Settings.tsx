import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Settings() {
  const [profile, setProfile] = useState<any>(null);
  const [prompts, setPrompts] = useState<any[]>([]);
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    loadProfile();
    loadPrompts();
  }, []);

  const loadProfile = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.user.id)
      .maybeSingle();

    if (data) {
      setProfile(data);
      setFullName(data.full_name || "");
    } else {
      // Create profile if doesn't exist
      await supabase.from("profiles").insert({
        user_id: user.user.id,
        full_name: "",
      });
    }
  };

  const loadPrompts = async () => {
    const { data } = await supabase
      .from("prompts")
      .select("*")
      .order("created_at");

    setPrompts(data || []);
  };

  const updateProfile = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { error } = await supabase
        .from("profiles")
        .upsert({
          user_id: user.user.id,
          full_name: fullName,
        });

      if (error) throw error;
      toast.success("Perfil actualizado");
      loadProfile();
    } catch (error: any) {
      toast.error("Error al actualizar perfil");
      console.error(error);
    }
  };

  const activatePrompt = async (promptId: string) => {
    try {
      // Deactivate all prompts first
      await supabase
        .from("prompts")
        .update({ is_active: false })
        .neq("id", "00000000-0000-0000-0000-000000000000");

      // Activate selected prompt
      const { error } = await supabase
        .from("prompts")
        .update({ is_active: true })
        .eq("id", promptId);

      if (error) throw error;
      toast.success("Prompt activado");
      loadPrompts();
    } catch (error: any) {
      toast.error("Error al activar prompt");
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Configuración</h1>
        <p className="mt-1 text-muted-foreground">Configura tu perfil y preferencias</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Perfil de Usuario</CardTitle>
            <CardDescription>Información de tu cuenta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile?.user_id ? "usuario@ejemplo.com" : ""}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre Completo</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Tu nombre completo"
              />
            </div>
            <Button onClick={updateProfile}>Guardar Cambios</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conexión API de IA</CardTitle>
            <CardDescription>Configuración de la API (solo lectura)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Endpoint</Label>
              <Input value="https://ai.gateway.lovable.dev/v1" disabled />
            </div>
            <div className="space-y-2">
              <Label>Modelo</Label>
              <Input value="google/gemini-2.5-flash" disabled />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Badge className="bg-success text-success-foreground">Conectado</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Prompts de Personalidad</CardTitle>
          <CardDescription>
            Selecciona el prompt activo que define la personalidad del agente de IA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {prompts.map((prompt) => (
              <div
                key={prompt.id}
                className="flex items-start justify-between rounded-lg border p-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{prompt.name}</h4>
                    {prompt.is_active && (
                      <Badge className="bg-success text-success-foreground">Activo</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{prompt.content}</p>
                </div>
                {!prompt.is_active && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => activatePrompt(prompt.id)}
                  >
                    Activar
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}