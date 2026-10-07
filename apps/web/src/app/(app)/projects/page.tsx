"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, FolderKanban, Calendar, ListChecks, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useProjects, useDeleteProject } from "@/hooks/useProjects";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Field";
import { PageLoader } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatDate, getErrorMessage, projectStatusLabel, projectStatusStyles } from "@/lib/utils";

export default function ProjectsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useProjects({ search, status: status || undefined });
  const deleteProject = useDeleteProject();

  const projects = data?.data ?? [];

  async function confirmDelete() {
    if (!deleteId) return;
    try {
      await deleteProject.mutateAsync(deleteId);
      toast.success("Project deleted");
      setDeleteId(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="block w-full rounded-lg border-0 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-600"
            />
          </div>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-48">
            <option value="">All statuses</option>
            <option value="NOT_STARTED">Not Started</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </Select>
        </div>
        <Button onClick={() => router.push("/projects/new")}>
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {isLoading && <PageLoader label="Loading projects..." />}
      {isError && <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />}

      {!isLoading && !isError && projects.length === 0 && (
        <EmptyState
          icon={FolderKanban}
          title={search || status ? "No projects match your filters" : "No projects yet"}
          description={
            search || status ? "Try adjusting your search or filters." : "Create your first project to get started."
          }
          action={
            !search && !status ? (
              <Button size="sm" onClick={() => router.push("/projects/new")}>
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            ) : undefined
          }
        />
      )}

      {!isLoading && !isError && projects.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <Link href={`/projects/${project.id}`} className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-slate-900 hover:text-brand-600">
                    {project.name}
                  </h3>
                </Link>
                <Badge className={projectStatusStyles[project.status]}>{projectStatusLabel[project.status]}</Badge>
              </div>

              {project.description && (
                <p className="mt-2 line-clamp-2 text-sm text-slate-500">{project.description}</p>
              )}

              <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <ListChecks className="h-3.5 w-3.5" />
                  {project._count?.tasks ?? 0} tasks
                </span>
                {project.endDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Due {formatDate(project.endDate)}
                  </span>
                )}
              </div>

              <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => router.push(`/projects/${project.id}/edit`)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setDeleteId(project.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete project?"
        description="This will permanently delete the project and all of its tasks. This cannot be undone."
        confirmLabel="Delete"
        danger
        isLoading={deleteProject.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
