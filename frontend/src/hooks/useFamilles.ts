import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { familleService } from "../services/familleService";
import type { FamillePayload } from "../types";

export const FAMILLES_KEY = ["familles"] as const;

export function useFamilles() {
  return useQuery({
    queryKey: FAMILLES_KEY,
    queryFn:  familleService.getAll,
  });
}

export function useFamille(id: string) {
  return useQuery({
    queryKey: [...FAMILLES_KEY, id],
    queryFn:  () => familleService.getById(id),
    enabled:  !!id,
  });
}

export function useCreateFamille() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: FamillePayload) => familleService.create(payload),
    onSuccess:  () => qc.invalidateQueries({ queryKey: FAMILLES_KEY }),
  });
}

export function useUpdateFamille(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: FamillePayload) => familleService.update(id, payload),
    onSuccess:  () => qc.invalidateQueries({ queryKey: FAMILLES_KEY }),
  });
}

export function useDeleteFamille() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => familleService.delete(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: FAMILLES_KEY }),
  });
}