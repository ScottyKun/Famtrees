import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { arbreService } from "../services/arbreService";
import type { ArbrePayload } from "../types";

export const ARBRES_KEY = ["arbres"] as const;

export function useArbres() {
  return useQuery({
    queryKey: ARBRES_KEY,
    queryFn:  arbreService.getAll,
  });
}

export function useArbre(id: string) {
  return useQuery({
    queryKey: [...ARBRES_KEY, id],
    queryFn:  () => arbreService.getById(id),
    enabled:  !!id,
  });
}

// Génération Neo4j depuis la racine_id stockée en PostgreSQL
export function useGenerateArbre(id: string, depth?: number) {
  return useQuery({
    queryKey: [...ARBRES_KEY, id, "generate", depth],
    queryFn:  () => arbreService.generate(id, depth),
    enabled:  !!id,
    // L'arbre Neo4j ne change pas souvent — on garde en cache 10 minutes
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateArbre() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ArbrePayload) => arbreService.create(payload),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ARBRES_KEY }),
  });
}

export function useUpdateArbre(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<ArbrePayload>) => arbreService.update(id, payload),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ARBRES_KEY }),
  });
}

export function useDeleteArbre() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => arbreService.delete(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ARBRES_KEY }),
  });
}