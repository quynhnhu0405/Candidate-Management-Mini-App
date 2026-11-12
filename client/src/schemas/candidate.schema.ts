import { z } from "zod";

// Keep these rules in sync with server/src/modules/candidate/candidate.schema.ts
// Messages are translation KEYS (validation.*); the form translates them when it shows an error.
export const candidateFormSchema = z.object({
  fullName: z.string().trim().min(1, "validation.fullNameRequired").max(255, "validation.fullNameTooLong"),
  email: z.string().trim().min(1, "validation.emailRequired").pipe(z.email("validation.emailInvalid")),
  phone: z
    .string()
    .trim()
    .max(50, "validation.phoneTooLong")
    .regex(/^[0-9+()\-\s.]*$/, "validation.phoneInvalid"),
  position: z.string().trim().min(1, "validation.positionRequired").max(255, "validation.positionTooLong"),
  yearsOfExperience: z
    .number({ error: "validation.yearsNumber" })
    .int("validation.yearsInteger")
    .min(0, "validation.yearsRange")
    .max(50, "validation.yearsRange"),
  skills: z.array(z.string().trim().min(1)),
  experience: z.string().trim(),
});

export type CandidateFormValues = z.infer<typeof candidateFormSchema>;
