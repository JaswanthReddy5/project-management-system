"use client";

import { useState } from "react";
import { Plus, Search, ListChecks } from "lucide-react";
import { toast } from "sonner";
import type { Task, TaskFormValues } from "@pms/shared";
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { PageLoader } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TaskForm } from "@/components/tasks/TaskForm";
import { TaskRow } from "@/components/tasks/TaskRow";
import { getErrorMessage } from "@/lib/utils";

export default function TasksPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [projectId, setProjectId] = useState("");
  const [taskModal, setTaskModal] = useState<{ mode: "create" | "edit"; task?: Task } | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useTasks({
    search,
    status: status || undefined,
    priority: priority || undefined,
    projectId: projectId || undefined,
  });
  const { data: projectsData } = useProjects({ limit: 100 });
  const createTask = useCreateTask();
  const deleteTask = useDeleteTask();

  const tasks = data?.data ?? [];
  const projects = projectsData?.data ?? [];

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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="block w-full rounded-lg border-0 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-600"
            />
          </div>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </Select>
          <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="">All priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </Select>
          <Select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="">All projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
        <Button onClick={() => setTaskModal({ mode: "create" })} disabled={projects.length === 0}>
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </div>

      {isLoading && <PageLoader label="Loading tasks..." />}
      {isError && <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />}

      {!isLoading && !isError && tasks.length === 0 && (
        <EmptyState
          icon={ListChecks}
          title={search || status || priority || projectId ? "No tasks match your filters" : "No tasks yet"}
          description={
            projects.length === 0
              ? "Create a project first, then add tasks to it."
              : "Create a task to get started."
          }
        />
      )}

      {!isLoading && !isError && tasks.length > 0 && (
        <Card className="p-4 sm:p-6">
          {tasks.map((task) => (
            <TaskRowContainer
              key={task.id}
              task={task}
              onEdit={() => setTaskModal({ mode: "edit", task })}
              onDelete={() => setDeleteTaskId(task.id)}
            />
          ))}
        </Card>
      )}

      <Modal
        open={Boolean(taskModal)}
        title={taskModal?.mode === "edit" ? "Edit Task" : "New Task"}
        onClose={() => setTaskModal(null)}
      >
        {taskModal?.mode === "create" && (
          <TaskForm
            projects={projects}
            submitLabel="Create task"
            onSubmit={handleCreateTask}
            onCancel={() => setTaskModal(null)}
          />
        )}
        {taskModal?.mode === "edit" && taskModal.task && (
          <EditTaskForm projects={projects} task={taskModal.task} onDone={() => setTaskModal(null)} />
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

function TaskRowContainer({ task, onEdit, onDelete }: { task: Task; onEdit: () => void; onDelete: () => void }) {
  const updateTask = useUpdateTask(task.id, task.projectId);

  return (
    <TaskRow
      task={task}
      showProject
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
  projects,
  task,
  onDone,
}: {
  projects: Array<{ id: string; name: string }>;
  task: Task;
  onDone: () => void;
}) {
  const updateTask = useUpdateTask(task.id, task.projectId);

  async function handleSubmit(values: TaskFormValues) {
    try {
      await updateTask.mutateAsync({
        name: values.name,
        description: values.description || undefined,
        priority: values.priority,
        status: values.status,
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
      projects={projects}
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
