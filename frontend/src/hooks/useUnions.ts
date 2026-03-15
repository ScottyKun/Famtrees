import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { unionService } from "../services/unionService";
import type { UnionPayload } from "../types";

export const UNIONS_KEY = ["unions"] as const;

export function useUnions() {
  return useQuery({
    queryKey: UNIONS_KEY,
    queryFn:  unionService.getAll,
  });
}

export function useUnion(id: string) {
  return useQuery({
    queryKey: [...UNIONS_KEY, id],
    queryFn:  () => unionService.getById(id),
    enabled:  !!id,
  });
}

export function useCreateUnion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UnionPayload) => unionService.create(payload),
    onSuccess:  () => qc.invalidateQueries({ queryKey: UNIONS_KEY }),
  });
}

export function useUpdateUnion(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UnionPayload) => unionService.update(id, payload),
    onSuccess:  () => qc.invalidateQueries({ queryKey: UNIONS_KEY }),
  });
}

export function useDeleteUnion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => unionService.delete(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: UNIONS_KEY }),
  });
}