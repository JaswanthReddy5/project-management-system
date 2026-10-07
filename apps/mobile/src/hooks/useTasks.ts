import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tasksApi, type TasksListParams } from "../lib/endpoints";

export function useTasks(params: TasksListParams) {
  return useQuery({
    queryKey: ["tasks", params],
    queryFn: () => tasksApi.list(params),
  });
}

export function useTask(id: string | undefined) {
  return useQuery({
    queryKey: ["task", id],
    queryFn: () => tasksApi.get(id as string),
    enabled: Boolean(id),
  });
}

function invalidateTaskRelated(qc: ReturnType<typeof useQueryClient>, projectId?: string) {
  qc.invalidateQueries({ queryKey: ["tasks"] });
  qc.invalidateQueries({ queryKey: ["dashboard"] });
  if (projectId) qc.invalidateQueries({ queryKey: ["project", projectId] });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Record<string, unknown>) => tasksApi.create(input),
    onSuccess: (res) => invalidateTaskRelated(qc, res.data.projectId),
  });
}

export function useUpdateTask(id: string, projectId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Record<string, unknown>) => tasksApi.update(id, input),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["task", id] });
      invalidateTaskRelated(qc, projectId ?? res.data.projectId);
    },
  });
}

export function useDeleteTask(projectId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tasksApi.remove(id),
    onSuccess: () => invalidateTaskRelated(qc, projectId),
  });
}
