"use client";

import Link from "next/link";
import { FolderKanban, ListChecks, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { useDashboard } from "@/hooks/useDashboard";
import { Card } from "@/components/ui/Card";
import { PageLoader } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import {
  formatDate,
  getErrorMessage,
  projectStatusLabel,
  projectStatusStyles,
  taskStatusLabel,
  taskStatusStyles,
} from "@/lib/utils";

const stats = [
  { key: "totalProjects", label: "Total Projects", icon: FolderKanban, color: "bg-brand-50 text-brand-600" },
  { key: "totalTasks", label: "Total Tasks", icon: ListChecks, color: "bg-indigo-50 text-indigo-600" },
  { key: "completedTasks", label: "Completed Tasks", icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600" },
  { key: "pendingTasks", label: "Pending Tasks", icon: Clock, color: "bg-amber-50 text-amber-600" },
  { key: "projectsInProgress", label: "Projects In Progress", icon: TrendingUp, color: "bg-blue-50 text-blue-600" },
] as const;

export default function DashboardPage() {
  const { data, isLoading, isError, error, refetch } = useDashboard();

  if (isLoading) return <PageLoader label="Loading dashboard..." />;
  if (isError) return <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />;

  const stats_data = data!.data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map(({ key, label, icon: Icon, color }) => (
          <Card key={key} className="p-5">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="mt-4 text-2xl font-semibold text-slate-900">{stats_data[key]}</p>
            <p className="text-sm text-slate-500">{label}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Recent Projects</h2>
            <Link href="/projects" className="text-sm font-medium text-brand-600 hover:text-brand-700">
              View all
            </Link>
          </div>
          {stats_data.recentProjects.length === 0 ? (
            <EmptyState title="No projects yet" description="Create your first project to get started." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {stats_data.recentProjects.map((project) => (
                <li key={project.id} className="flex items-center justify-between py-3">
                  <div>
                    <Link
                      href={`/projects/${project.id}`}
                      className="text-sm font-medium text-slate-900 hover:text-brand-600"
                    >
                      {project.name}
                    </Link>
                    <p className="text-xs text-slate-500">Created {formatDate(project.createdAt)}</p>
                  </div>
                  <Badge className={projectStatusStyles[project.status]}>{projectStatusLabel[project.status]}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Recent Tasks</h2>
            <Link href="/tasks" className="text-sm font-medium text-brand-600 hover:text-brand-700">
              View all
            </Link>
          </div>
          {stats_data.recentTasks.length === 0 ? (
            <EmptyState title="No tasks yet" description="Add a task under one of your projects." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {stats_data.recentTasks.map((task) => (
                <li key={task.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{task.name}</p>
                    <p className="text-xs text-slate-500">{task.project?.name}</p>
                  </div>
                  <Badge className={taskStatusStyles[task.status]}>{taskStatusLabel[task.status]}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
