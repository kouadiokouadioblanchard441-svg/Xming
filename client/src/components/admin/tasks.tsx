import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Edit, Loader2, Trophy, Plus, Trash2 } from "lucide-react";
import type { Task } from "@shared/schema";

const taskSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(2),
  requiredInvites: z.string().min(1),
  reward: z.string().min(1),
  sortOrder: z.string().min(1),
});

type TaskForm = z.infer<typeof taskSchema>;

export default function AdminTasks() {
  const { toast } = useToast();
  const { t } = useI18n();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const { data: taskList, isLoading } = useQuery<Task[]>({
    queryKey: ["/api/admin/tasks"],
  });

  const editForm = useForm<TaskForm>({
    resolver: zodResolver(taskSchema),
    defaultValues: { name: "", description: "", requiredInvites: "1", reward: "0", sortOrder: "1" },
  });

  const createForm = useForm<TaskForm>({
    resolver: zodResolver(taskSchema),
    defaultValues: { name: "", description: "", requiredInvites: "1", reward: "0", sortOrder: "1" },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/tasks"] });
    queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
  };

  const createMutation = useMutation({
    mutationFn: async (data: TaskForm) => {
      const res = await apiRequest("POST", "/api/admin/tasks", {
        name: data.name,
        description: data.description,
        requiredInvites: parseInt(data.requiredInvites),
        reward: parseInt(data.reward),
        sortOrder: parseInt(data.sortOrder),
      });
      if (!res.ok) { const r = await res.json(); throw new Error(r.message || t.errorOccurred); }
      return res.json();
    },
    onSuccess: () => { invalidate(); toast({ title: t.adminTaskCreated }); setShowCreateForm(false); createForm.reset(); },
    onError: (e: any) => toast({ title: e.message || t.errorOccurred, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Task> }) => {
      const res = await apiRequest("PATCH", `/api/admin/tasks/${id}`, data);
      if (!res.ok) { const r = await res.json(); throw new Error(r.message || t.errorOccurred); }
      return res.json();
    },
    onSuccess: () => { invalidate(); toast({ title: t.adminTaskUpdated }); setSelectedTask(null); },
    onError: (e: any) => toast({ title: e.message || t.errorOccurred, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/tasks/${id}`, { isActive });
      if (!res.ok) { const r = await res.json(); throw new Error(r.message || t.errorOccurred); }
      return res.json();
    },
    onSuccess: () => invalidate(),
    onError: (e: any) => toast({ title: e.message || t.errorOccurred, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/tasks/${id}`, {});
      if (!res.ok) { const r = await res.json(); throw new Error(r.message || t.errorOccurred); }
      return res.json();
    },
    onSuccess: () => { invalidate(); toast({ title: t.adminTaskDeleted }); setConfirmDeleteId(null); },
    onError: (e: any) => toast({ title: e.message || t.errorOccurred, variant: "destructive" }),
  });

  const openEdit = (task: Task) => {
    setSelectedTask(task);
    editForm.reset({
      name: task.name,
      description: task.description,
      requiredInvites: task.requiredInvites.toString(),
      reward: task.reward.toString(),
      sortOrder: task.sortOrder.toString(),
    });
  };

  const handleUpdate = (data: TaskForm) => {
    if (!selectedTask) return;
    updateMutation.mutate({
      id: selectedTask.id,
      data: {
        name: data.name,
        description: data.description,
        requiredInvites: parseInt(data.requiredInvites),
        reward: parseInt(data.reward),
        sortOrder: parseInt(data.sortOrder),
      },
    });
  };

  const TaskFormFields = ({ form, isPending }: { form: any; isPending: boolean }) => (
    <div className="space-y-4">
      <FormField control={form.control} name="name" render={({ field }) => (
        <FormItem>
          <FormLabel>{t.adminTaskName}</FormLabel>
          <FormControl><Input placeholder={t.adminTaskNamePlaceholder} {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <FormField control={form.control} name="description" render={({ field }) => (
        <FormItem>
          <FormLabel>{t.adminTaskDescriptionLabel}</FormLabel>
          <FormControl><Input placeholder={t.adminTaskDescriptionPlaceholder} {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <div className="grid grid-cols-3 gap-3">
        <FormField control={form.control} name="requiredInvites" render={({ field }) => (
          <FormItem>
            <FormLabel>{t.adminTaskRequiredInvites}</FormLabel>
            <FormControl><Input type="number" min="1" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="reward" render={({ field }) => (
          <FormItem>
            <FormLabel>{t.adminTaskReward}</FormLabel>
            <FormControl><Input type="number" min="0" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="sortOrder" render={({ field }) => (
          <FormItem>
            <FormLabel>{t.adminTaskSortOrder}</FormLabel>
            <FormControl><Input type="number" min="0" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {t.adminSave}
      </Button>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">{t.adminTaskCenterTitle}</h2>
          <p className="text-sm text-muted-foreground">{t.adminTaskCenterDesc}</p>
        </div>
        <Button size="sm" onClick={() => setShowCreateForm(true)}>
          <Plus className="w-4 h-4 mr-1" /> {t.adminTaskNew}
        </Button>
      </div>

      {/* Task list */}
      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24" />)}</div>
      ) : !taskList?.length ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">{t.adminNoTasks}</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {taskList.map(task => (
            <Card key={task.id} className={!task.isActive ? "opacity-60" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="mt-0.5 p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                      <Trophy className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{task.name}</span>
                        <Badge variant={task.isActive ? "default" : "secondary"} className="text-xs">
                          {task.isActive ? t.adminTaskActive : t.adminTaskInactive}
                        </Badge>
                        <Badge variant="outline" className="text-xs">#{task.sortOrder}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
                      <div className="flex gap-4 mt-2 text-xs">
                        <span className="text-blue-600 font-medium">
                          👥 {task.requiredInvites} {t.adminTaskRequiredInvites}
                        </span>
                        <span className="text-gray-600 font-medium">
                          🎁 {task.reward.toLocaleString()} USDT
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={task.isActive}
                      onCheckedChange={(v) => toggleMutation.mutate({ id: task.id, isActive: v })}
                    />
                    <Button size="icon" variant="ghost" onClick={() => openEdit(task)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setConfirmDeleteId(task.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t.adminTaskNew}</DialogTitle></DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(d => createMutation.mutate(d))}>
              <TaskFormFields form={createForm} isPending={createMutation.isPending} />
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!selectedTask} onOpenChange={v => { if (!v) setSelectedTask(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t.adminTaskEdit}</DialogTitle></DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdate)}>
              <TaskFormFields form={editForm} isPending={updateMutation.isPending} />
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={confirmDeleteId !== null} onOpenChange={v => { if (!v) setConfirmDeleteId(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t.adminConfirmDelete}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">{t.adminTaskDeleteWarning}</p>
          <div className="flex gap-3 mt-2">
            <Button variant="outline" className="flex-1" onClick={() => setConfirmDeleteId(null)}>{t.adminCancel}</Button>
            <Button
              variant="destructive"
              className="flex-1"
              disabled={deleteMutation.isPending}
              onClick={() => confirmDeleteId && deleteMutation.mutate(confirmDeleteId)}
            >
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t.adminTaskDelete}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
