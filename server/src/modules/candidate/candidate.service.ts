import { Brackets, type SelectQueryBuilder } from "typeorm";
import { AppDataSource } from "../../data-source";
import { Candidate, CandidateStatus } from "../../entities/Candidate";
import { type CandidateInput, type ListQuery, MIN_EXPERIENCE_FOR_AI } from "./candidate.schema";
import { summarizeExperience } from "../ai/ai.service";
import { AppError } from "../../shared/utils/AppError";
import { ACCENT_FROM, ACCENT_TO, removeAccents } from "../../shared/utils/text";

const repo = () => AppDataSource.getRepository(Candidate);

const escapeLike = (text: string) => text.replace(/[\\%_]/g, "\\$&");

// Case- and accent-insensitive search on name, email, position and skills.
// translate() strips accents from the stored text, removeAccents() does the same for the search term,
// and ILIKE ignores case. Values always go through parameters, so there is no SQL injection.
const plain = (column: string) => `translate(${column}, :accentFrom, :accentTo)`;

const applySearch = (qb: SelectQueryBuilder<Candidate>, q?: string) => {
  if (!q) return qb;
  return qb
    .andWhere(
      new Brackets((w) => {
        w.where(`${plain("c.fullName")} ILIKE :like`)
          .orWhere("c.email ILIKE :like")
          .orWhere(`${plain("c.position")} ILIKE :like`)
          .orWhere(`${plain("array_to_string(c.skills, ' ')")} ILIKE :like`);
      }),
    )
    .setParameters({
      like: `%${escapeLike(removeAccents(q))}%`,
      accentFrom: ACCENT_FROM,
      accentTo: ACCENT_TO,
    });
};

const SORT_COLUMNS = { createdAt: "c.createdAt", fullName: "c.fullName" } as const;

export async function listCandidates(query: ListQuery) {
  const { q, status, page, pageSize, sort, order } = query;

  const listQb = applySearch(repo().createQueryBuilder("c"), q);
  if (status) listQb.andWhere("c.status = :status", { status });

  const [data, total] = await listQb
    .orderBy(SORT_COLUMNS[sort], order.toUpperCase() as "ASC" | "DESC")
    .addOrderBy("c.id", "ASC")
    .skip((page - 1) * pageSize)
    .take(pageSize)
    .getManyAndCount();

  const rows = await applySearch(repo().createQueryBuilder("c"), q)
    .select("c.status", "status")
    .addSelect("COUNT(*)", "count")
    .groupBy("c.status")
    .getRawMany<{ status: CandidateStatus; count: string }>();

  const statusCounts = Object.fromEntries(
    Object.values(CandidateStatus).map((s) => [s, 0]),
  ) as Record<CandidateStatus, number>;
  for (const row of rows) statusCounts[row.status] = Number(row.count);

  return { data, total, page, pageSize, statusCounts };
}

export async function getCandidate(id: string) {
  const candidate = await repo().findOneBy({ id });
  if (!candidate) throw new AppError(404, "NOT_FOUND", "Candidate not found");
  return candidate;
}

export async function createCandidate(input: CandidateInput) {
  const candidate = repo().create({ ...input, phone: input.phone || null });
  return repo().save(candidate); // duplicate email → error 23505 → errorHandler returns 409
}

export async function updateCandidate(id: string, input: CandidateInput) {
  const candidate = await getCandidate(id);
  Object.assign(candidate, input, { phone: input.phone || null });
  return repo().save(candidate);
}

export async function updateCandidateStatus(id: string, status: CandidateStatus) {
  const candidate = await getCandidate(id);
  candidate.status = status;
  return repo().save(candidate);
}

// Generate (or regenerate) the AI summary and save it on the candidate.
export async function summarizeCandidate(id: string) {
  const candidate = await getCandidate(id);
  if (candidate.experience.trim().length < MIN_EXPERIENCE_FOR_AI) {
    throw new AppError(
      400,
      "EXPERIENCE_TOO_SHORT",
      `Experience description must be at least ${MIN_EXPERIENCE_FOR_AI} characters to generate a summary`,
    );
  }

  candidate.aiSummary = await summarizeExperience({
    position: candidate.position,
    yearsOfExperience: candidate.yearsOfExperience,
    skills: candidate.skills,
    experience: candidate.experience,
  });
  candidate.summarizedAt = new Date();
  return repo().save(candidate);
}

export async function deleteCandidate(id: string) {
  const candidate = await getCandidate(id);
  await repo().remove(candidate);
}
