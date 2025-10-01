import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  User,
  Mail,
  Key,
  Server,
  Cpu,
  CheckCircle2,
  Bot,
  Plus,
  Edit,
  Trash2,
  Sparkles,
  XCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface PromptFormData {
  name: string;
  description: string;
  text: string;
}

export default function Settings() {
  const [user, setUser] = useState<any>(null);
  const [prompts, setPrompts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<any>(null);
  const [deletingPromptId, setDeletingPromptId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PromptFormData>({
    name: "",
    description: "",
    text: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  useEffect(() => {
    loadData();
    checkApiStatus();
  }, []);

  const loadData = async () => {
    try {
      const [userData, promptsData] = await Promise.all([
        api.getCurrentUser(),
        api.getPrompts(),
      ]);
      setUser(userData);
      setPrompts(promptsData || []);
    } catch (error: any) {
      toast.error("Error al cargar la configuración");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const checkApiStatus = async () => {
    try {
      // Try to get prompts as a health check for the API
      await api.getPrompts();
      setApiStatus('connected');
    } catch (error) {
      setApiStatus('disconnected');
    }
  };

  const activatePrompt = async (promptId: string) => {
    try {
      await api.togglePrompt(promptId);
      toast.success("Agente activado correctamente");
      loadData();
    } catch (error: any) {
      toast.error("No se pudo activar el agente");
      console.error(error);
    }
  };

  const openCreateDialog = () => {
    setEditingPrompt(null);
    setFormData({ name: "", description: "", text: "" });
    setIsDialogOpen(true);
  };

  const openEditDialog = (prompt: any) => {
    setEditingPrompt(prompt);
    setFormData({
      name: prompt.name,
      description: prompt.description || "",
      text: prompt.text,
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingPrompt(null);
    setFormData({ name: "", description: "", text: "" });
  };

  const handleSavePrompt = async () => {
    if (!formData.name.trim() || !formData.text.trim()) {
      toast.error("El nombre y el texto del prompt son obligatorios");
      return;
    }

    setIsSaving(true);
    try {
      if (editingPrompt) {
        await api.updatePrompt(editingPrompt.id, formData);
        toast.success("Agente actualizado correctamente");
      } else {
        await api.createPrompt(formData);
        toast.success("Agente creado correctamente");
      }
      closeDialog();
      loadData();
    } catch (error: any) {
      toast.error(editingPrompt ? "Error al actualizar el agente" : "Error al crear el agente");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const openDeleteDialog = (promptId: string) => {
    setDeletingPromptId(promptId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeletePrompt = async () => {
    if (!deletingPromptId) return;

    try {
      await api.deletePrompt(deletingPromptId);
      toast.success("Agente eliminado correctamente");
      setIsDeleteDialogOpen(false);
      setDeletingPromptId(null);
      loadData();
    } catch (error: any) {
      toast.error("No se pudo eliminar el agente");
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
          <p className="text-muted-foreground">
            Administra tu perfil, conexiones y personalidades del agente de IA
          </p>
        </div>

        {/* User Profile & API Connection */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* User Profile */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Perfil de Usuario</CardTitle>
              </div>
              <CardDescription>
                Información de tu cuenta en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Avatar */}
              <div className="flex items-center justify-center">
                <div className="relative">
                  <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-muted bg-muted">
                    {user?.photoUrl ? (
                      <img
                        src={user.photoUrl}
                        alt={user.name || "Usuario"}
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted">
                        <User className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <p className="truncate text-sm font-medium">{user?.email || "—"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <Label className="text-xs text-muted-foreground">Nombre</Label>
                    <p className="truncate text-sm font-medium">{user?.name || "—"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                  <Key className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <Label className="text-xs text-muted-foreground">ID de Usuario</Label>
                    <p className="truncate font-mono text-xs">{user?.id || "—"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Connection */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Conexión API de IA</CardTitle>
              </div>
              <CardDescription>
                Configuración de Google Gemini AI (solo lectura)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                  <Server className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <Label className="text-xs text-muted-foreground">Proveedor</Label>
                    <p className="truncate text-sm font-medium">Google Gemini AI</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                  <Cpu className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <Label className="text-xs text-muted-foreground">Modelo</Label>
                    <p className="truncate text-xs font-mono">gemini-2.0-flash-exp</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                  <Server className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <Label className="text-xs text-muted-foreground">Endpoint</Label>
                    <p className="truncate text-xs font-mono">generativelanguage.googleapis.com</p>
                  </div>
                </div>

                <div className={`flex items-center gap-3 rounded-lg border p-3 ${
                  apiStatus === 'connected' ? 'bg-green-500/10' : 
                  apiStatus === 'disconnected' ? 'bg-red-500/10' : 'bg-muted/30'
                }`}>
                  {apiStatus === 'connected' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : apiStatus === 'disconnected' ? (
                    <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  ) : (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Estado</Label>
                    <p className={`text-sm font-medium ${
                      apiStatus === 'connected' ? 'text-green-700 dark:text-green-400' :
                      apiStatus === 'disconnected' ? 'text-red-700 dark:text-red-400' :
                      'text-muted-foreground'
                    }`}>
                      {apiStatus === 'connected' ? 'Conectado y operativo' :
                       apiStatus === 'disconnected' ? 'Desconectado' :
                       'Verificando...'}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border bg-blue-500/10 p-3">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 text-sm">ℹ️</span>
                    <div className="flex-1">
                      <p className="text-xs text-blue-700 dark:text-blue-400">
                        <strong>Nota:</strong> La API key se configura en las variables de entorno del servidor (GEMINI_API_KEY).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Prompts Management */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle>Personalidades del Agente</CardTitle>
                  <CardDescription className="mt-1">
                    Gestiona los prompts que definen el comportamiento y personalidad del agente de IA
                  </CardDescription>
                </div>
              </div>
              <Button onClick={openCreateDialog} className="gap-2 sm:w-auto">
                <Plus className="h-4 w-4" />
                Crear Agente
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {prompts.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-12 text-center">
                  <div className="rounded-full bg-muted p-3">
                    <Bot className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">No hay agentes configurados</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Crea tu primer agente para comenzar
                    </p>
                  </div>
                  <Button onClick={openCreateDialog} className="mt-2 gap-2">
                    <Plus className="h-4 w-4" />
                    Crear Primer Agente
                  </Button>
                </div>
              ) : (
                prompts.map((prompt) => (
                  <div
                    key={prompt.id}
                    className="group relative flex flex-col gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold">{prompt.name}</h4>
                        {prompt.isActive && (
                          <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">
                            <Sparkles className="mr-1 h-3 w-3" />
                            Activo
                          </Badge>
                        )}
                        {prompt.isDefault && (
                          <Badge variant="outline">Por defecto</Badge>
                        )}
                      </div>
                      {prompt.description && (
                        <p className="text-sm text-muted-foreground">{prompt.description}</p>
                      )}
                      <details className="group/details">
                        <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                          Ver prompt completo
                        </summary>
                        <p className="mt-2 whitespace-pre-wrap rounded-md bg-muted/50 p-3 text-xs">
                          {prompt.text}
                        </p>
                      </details>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{prompt._count?.messages || 0} mensajes generados</span>
                        <span>•</span>
                        <span>{prompt._count?.conversations || 0} conversaciones</span>
                      </div>
                    </div>
                    <div className="flex gap-2 sm:flex-col">
                      {!prompt.isActive && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => activatePrompt(prompt.id)}
                          className="flex-1 gap-2 sm:flex-none"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Activar
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(prompt)}
                        className="flex-1 gap-2 sm:flex-none"
                      >
                        <Edit className="h-4 w-4" />
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteDialog(prompt.id)}
                        className="flex-1 gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive sm:flex-none"
                      >
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingPrompt ? "Editar Agente" : "Crear Nuevo Agente"}
            </DialogTitle>
            <DialogDescription>
              {editingPrompt
                ? "Modifica la configuración de este agente de IA"
                : "Define la personalidad y comportamiento del nuevo agente de IA"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Nombre del Agente <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Ej: Asistente Amigable, Experto Técnico, etc."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                placeholder="Breve descripción de la personalidad del agente"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="text">
                Prompt del Sistema <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="text"
                placeholder="Eres un asistente virtual amigable y servicial que..."
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                rows={8}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Este texto define cómo se comportará el agente en las conversaciones
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSavePrompt} disabled={isSaving}>
              {isSaving ? "Guardando..." : editingPrompt ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El agente será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePrompt}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}