import { z } from "zod";

export const MIN_EXPERIENCE_FOR_AI = 30;
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

export const candidateStatusSchema = z.enum(["NEW", "CONTACTED", "SHORTLISTED", "REJECTED"], {
  error: "Invalid status (NEW, CONTACTED, SHORTLISTED or REJECTED)",
});

export const candidateInputSchema = z.object({
  fullName: z
    .string({ error: "Full name is required" })
    .trim()
    .min(1, "Full name is required")
    .max(255),
  email: z
    .string({ error: "Email is required" })
    .trim()
    .toLowerCase()
    .min(1, "Email is required")
    .pipe(z.email("Invalid email address")),
  phone: z.string().trim().max(50).optional(),
  position: z
    .string({ error: "Position is required" })
    .trim()
    .min(1, "Position is required")
    .max(255),
  yearsOfExperience: z.coerce
    .number({ error: "Years of experience must be a number" })
    .int("Years of experience must be an integer")
    .min(0, "Years of experience must be between 0 and 50")
    .max(50, "Years of experience must be between 0 and 50"),
  skills: z.array(z.string().trim().min(1)).default([]),
  experience: z.string().trim().default(""),
});

export const updateStatusSchema = z.object({
  status: candidateStatusSchema,
});

export const listQuerySchema = z.object({
  q: z.string().trim().optional(),
  status: candidateStatusSchema.optional(),
  page: z.coerce
    .number({ error: "Page must be a number" })
    .int()
    .min(1, "Page must be at least 1")
    .default(1),
  pageSize: z.coerce
    .number({ error: "Page size must be a number" })
    .int()
    .min(1, "Page size must be at least 1")
    .max(MAX_PAGE_SIZE, `Page size must be at most ${MAX_PAGE_SIZE}`)
    .default(DEFAULT_PAGE_SIZE),
  sort: z.enum(["createdAt", "fullName"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export type CandidateInput = z.infer<typeof candidateInputSchema>;
export type ListQuery = z.infer<typeof listQuerySchema>;
export type CandidateStatusValue = z.infer<typeof candidateStatusSchema>;
