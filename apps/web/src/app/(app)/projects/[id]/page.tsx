"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, ListChecks, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import type { Task, TaskFormValues } from "@pms/shared";
import { useProject } from "@/hooks/useProjects";
import { useCreateTask, useDeleteTask, useUpdateTask } from "@/hooks/useTasks";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PageLoader } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TaskForm } from "@/components/tasks/TaskForm";
import { TaskRow } from "@/components/tasks/TaskRow";
import { formatDate, getErrorMessage, projectStatusLabel, projectStatusStyles } from "@/lib/utils";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading, isError, error, refetch } = useProject(id);

  const [taskModal, setTaskModal] = useState<{ mode: "create" | "edit"; task?: Task } | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);

  const createTask = useCreateTask();
  const deleteTask = useDeleteTask(id);

  if (isLoading) return <PageLoader label="Loading project..." />;
  if (isError) return <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />;

  const project = data!.data;

  async function handleCreateTask(values: TaskFormValues) {
    try {
      await createTask.mutateAsync({
        ...values,
        description: values.description || undefined,
        dueDate: values.dueDate || undefined,
      });
      toast.success("Task created");
      setTaskModal(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function confirmDeleteTask() {
    if (!deleteTaskId) return;
    try {
      await deleteTask.mutateAsync(deleteTaskId);
      toast.success("Task deleted");
      setDeleteTaskId(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push("/projects")}
        className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to projects
      </button>

      <Card className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-slate-900">{project.name}</h1>
              <Badge className={projectStatusStyles[project.status]}>{projectStatusLabel[project.status]}</Badge>
            </div>
            {project.description && <p className="mt-2 text-sm text-slate-600">{project.description}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(project.startDate)} – {formatDate(project.endDate)}
              </span>
              <span className="flex items-center gap-1">
                <ListChecks className="h-3.5 w-3.5" />
                {project.tasks.length} tasks
              </span>
            </div>
          </div>
          <Button variant="secondary" onClick={() => router.push(`/projects/${project.id}/edit`)}>
            <Pencil className="h-4 w-4" />
            Edit project
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Tasks</h2>
          <Button size="sm" onClick={() => setTaskModal({ mode: "create" })}>
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
        </div>

        {project.tasks.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title="No tasks yet"
            description="Add the first task for this project."
            action={
              <Button size="sm" onClick={() => setTaskModal({ mode: "create" })}>
                <Plus className="h-4 w-4" />
                Add Task
              </Button>
            }
          />
        ) : (
          <div>
            {project.tasks.map((task) => (
              <TaskRowContainer
                key={task.id}
                task={task}
                projectId={project.id}
                onEdit={() => setTaskModal({ mode: "edit", task })}
                onDelete={() => setDeleteTaskId(task.id)}
              />
            ))}
          </div>
        )}
      </Card>

      <Modal
        open={Boolean(taskModal)}
        title={taskModal?.mode === "edit" ? "Edit Task" : "New Task"}
        onClose={() => setTaskModal(null)}
      >
        {taskModal?.mode === "create" && (
          <TaskForm
            projects={[project]}
            defaultValues={{ projectId: project.id }}
            lockProject
            submitLabel="Create task"
            onSubmit={handleCreateTask}
            onCancel={() => setTaskModal(null)}
          />
        )}
        {taskModal?.mode === "edit" && taskModal.task && (
          <EditTaskForm project={project} task={taskModal.task} onDone={() => setTaskModal(null)} />
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTaskId)}
        title="Delete task?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        danger
        isLoading={deleteTask.isPending}
        onConfirm={confirmDeleteTask}
        onCancel={() => setDeleteTaskId(null)}
      />
    </div>
  );
}

function TaskRowContainer({
  task,
  projectId,
  onEdit,
  onDelete,
}: {
  task: Task;
  projectId: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const updateTask = useUpdateTask(task.id, projectId);

  return (
    <TaskRow
      task={task}
      isUpdating={updateTask.isPending}
      onStatusChange={(status) =>
        updateTask.mutateAsync({ status }).catch((err) => toast.error(getErrorMessage(err)))
      }
      onPriorityChange={(priority) =>
        updateTask.mutateAsync({ priority }).catch((err) => toast.error(getErrorMessage(err)))
      }
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
}

function EditTaskForm({
  project,
  task,
  onDone,
}: {
  project: { id: string; name: string };
  task: Task;
  onDone: () => void;
}) {
  const updateTask = useUpdateTask(task.id, project.id);

  async function handleSubmit(values: TaskFormValues) {
    try {
      await updateTask.mutateAsync({
        ...values,
        description: values.description || undefined,
        dueDate: values.dueDate || undefined,
      });
      toast.success("Task updated");
      onDone();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <TaskForm
      projects={[project]}
      lockProject
      defaultValues={{
        projectId: task.projectId,
        name: task.name,
        description: task.description ?? "",
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
      }}
      submitLabel="Save changes"
      onSubmit={handleSubmit}
      onCancel={onDone}
    />
  );
}
