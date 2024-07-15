import { z } from 'zod'

export const paginationSchema = z.object({
  offset: z.number(),
  limit: z.number(),
  total: z.number(),
})

export type Pagination = z.infer<typeof paginationSchema>

export function isPagination(input: unknown): input is Pagination {
  return paginationSchema.safeParse(input).success
}

export const paginationParamsSchema = z.object({
  offset: z.number().optional(),
  limit: z.number().optional(),
})

export type PaginationParams = z.infer<typeof paginationParamsSchema>

export function isPaginationParams(input: unknown): input is PaginationParams {
  return paginationParamsSchema.safeParse(input).success
}

export const searchParamsSchema = paginationParamsSchema.extend({
  q: z.string().min(1).max(100),
})

export type SearchParams = z.infer<typeof searchParamsSchema>

export function isSearchParams(input: unknown): input is SearchParams {
  return searchParamsSchema.safeParse(input).success
}
