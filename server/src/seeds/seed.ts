import "reflect-metadata";
import { faker as fakerEN, fakerVI } from "@faker-js/faker";
import { AppDataSource } from "../data-source";
import { Candidate, CandidateStatus } from "../entities/Candidate";

// All data is FAKE (Faker); every seeded email uses the example.com domain.
const STATUSES = Object.values(CandidateStatus);

// ---------- Vietnamese candidates (Vietnamese names and experience text) ----------
const POSITIONS = [
  "Frontend Developer",
  "Backend Developer",
  "Fullstack Developer",
  "QA Engineer",
  "DevOps Engineer",
  "Business Analyst",
  "UI/UX Designer",
  "Data Analyst",
];

const SKILLS = [
  "React",
  "TypeScript",
  "Node.js",
  "PostgreSQL",
  "Docker",
  "AWS",
  "Java",
  "Python",
  "Figma",
  "SQL",
  "Jest",
  "Git",
  "Tailwind CSS",
  "Express",
  "Playwright",
];

function makeVietnameseExperience(position: string, years: number, skills: string[]): string {
  return (
    `Có ${years} năm kinh nghiệm ở vị trí ${position}. ` +
    `Làm việc chủ yếu với ${skills.join(", ")}. ` +
    `Đã tham gia ${fakerVI.number.int({ min: 2, max: 8 })} dự án, ` +
    `phối hợp nhóm theo quy trình Agile và cải thiện hiệu năng hệ thống. ` +
    `Chịu trách nhiệm viết tài liệu kỹ thuật, review code cho đồng nghiệp ` +
    `và làm việc với bộ phận kinh doanh để làm rõ yêu cầu trước mỗi sprint.`
  );
}

function makeVietnameseCandidates(repo: ReturnType<typeof AppDataSource.getRepository<Candidate>>) {
  fakerVI.seed(2026); // fixed seed so every run produces the same data

  return Array.from({ length: 18 }, (_, i) => {
    const firstName = fakerVI.person.firstName();
    const lastName = fakerVI.person.lastName();
    const position = fakerVI.helpers.arrayElement(POSITIONS);
    const years = fakerVI.number.int({ min: 0, max: 12 });
    const skills = fakerVI.helpers.arrayElements(SKILLS, { min: 2, max: 5 });

    return repo.create({
      fullName: `${lastName} ${firstName}`,
      email: `candidate${i + 1}@example.com`,
      phone: `09${fakerVI.string.numeric(8)}`,
      position,
      yearsOfExperience: years,
      skills,
      // 2 candidates have a too-short description to demo blocking AI summary (< 30 chars)
      experience: i < 2 ? "Mới ra trường." : makeVietnameseExperience(position, years, skills),
      status: STATUSES[i % STATUSES.length], // cycles through all 4 statuses
    });
  });
}

// ---------- English candidates (English names and longer experience text) ----------
interface RoleTemplate {
  position: string;
  domain: string;
  skills: string[];
  projects: string[];
  achievements: string[];
}

const ENGLISH_ROLES: RoleTemplate[] = [
  {
    position: "Frontend Developer",
    domain: "customer-facing web applications",
    skills: ["React", "TypeScript", "Next.js", "Tailwind CSS", "Jest", "Storybook"],
    projects: [
      "a design system used by six product teams",
      "a real-time analytics dashboard",
      "a redesigned checkout flow",
    ],
    achievements: [
      "cut the initial page load time by 40%",
      "raised Lighthouse performance scores from 62 to 94",
      "reduced UI bugs reported by QA by a third",
    ],
  },
  {
    position: "Backend Developer",
    domain: "high-traffic REST and event-driven services",
    skills: ["Node.js", "PostgreSQL", "Redis", "Docker", "AWS", "Express"],
    projects: [
      "a payment reconciliation service handling 2 million transactions a day",
      "a notification pipeline built on message queues",
      "a multi-tenant billing API",
    ],
    achievements: [
      "reduced p95 API latency from 800 ms to 220 ms",
      "migrated a monolith to services with zero downtime",
      "improved test coverage from 35% to 85%",
    ],
  },
  {
    position: "Fullstack Developer",
    domain: "internal tools and SaaS products",
    skills: ["React", "Node.js", "TypeScript", "PostgreSQL", "GraphQL", "Git"],
    projects: [
      "an HR onboarding portal used by 1,500 employees",
      "a self-service reporting module",
      "an inventory management platform",
    ],
    achievements: [
      "shipped the first production release in eight weeks",
      "automated a manual process that saved 30 hours of work per week",
      "introduced code reviews and CI checks that halved release incidents",
    ],
  },
  {
    position: "QA Engineer",
    domain: "web and mobile products",
    skills: ["Playwright", "Cypress", "Jest", "Postman", "SQL", "Git"],
    projects: [
      "an end-to-end regression suite with 400 automated tests",
      "an API contract testing setup",
      "a release checklist adopted by three squads",
    ],
    achievements: [
      "cut regression testing time from three days to four hours",
      "caught critical defects before launch on five major releases",
      "reduced flaky tests from 12% to under 2%",
    ],
  },
  {
    position: "DevOps Engineer",
    domain: "cloud infrastructure and delivery pipelines",
    skills: ["AWS", "Docker", "Kubernetes", "Terraform", "GitHub Actions", "Python"],
    projects: [
      "a Terraform-based infrastructure platform",
      "zero-downtime blue/green deployments",
      "a centralized logging and alerting stack",
    ],
    achievements: [
      "reduced monthly cloud costs by 28%",
      "shortened deployment time from 45 to 8 minutes",
      "reached 99.95% uptime across all production services",
    ],
  },
  {
    position: "Data Analyst",
    domain: "product and marketing analytics",
    skills: ["SQL", "Python", "Power BI", "Excel", "dbt", "Tableau"],
    projects: [
      "a self-serve KPI dashboard for the executive team",
      "a customer churn analysis",
      "an A/B testing framework",
    ],
    achievements: [
      "identified a retention issue that recovered 6% of monthly revenue",
      "cut weekly reporting effort from two days to two hours",
      "standardized metric definitions across four departments",
    ],
  },
  {
    position: "UI/UX Designer",
    domain: "mobile and web product design",
    skills: ["Figma", "User Research", "Prototyping", "Design Systems", "Accessibility"],
    projects: [
      "a complete redesign of the onboarding experience",
      "a component library shared with engineering",
      "a mobile banking app prototype tested with 40 users",
    ],
    achievements: [
      "increased sign-up conversion by 18%",
      "cut design-to-development handoff time in half",
      "brought the product to WCAG AA accessibility compliance",
    ],
  },
  {
    position: "Business Analyst",
    domain: "enterprise software and process improvement",
    skills: ["SQL", "Jira", "Confluence", "BPMN", "User Stories", "Excel"],
    projects: [
      "a requirements overhaul for a CRM migration",
      "a loan approval workflow redesign",
      "a vendor management portal",
    ],
    achievements: [
      "reduced approval cycle time by 35%",
      "cut change requests after development by half",
      "aligned five stakeholder groups on a single product roadmap",
    ],
  },
];

function makeEnglishCandidate(
  repo: ReturnType<typeof AppDataSource.getRepository<Candidate>>,
  index: number,
) {
  const f = fakerEN;
  const role = ENGLISH_ROLES[index % ENGLISH_ROLES.length];
  const firstName = f.person.firstName();
  const lastName = f.person.lastName();
  const years = f.number.int({ min: 2, max: 12 });
  const skills = f.helpers.arrayElements(role.skills, { min: 4, max: 5 });
  const [project1, project2] = f.helpers.arrayElements(role.projects, 2);
  const [achievement1, achievement2] = f.helpers.arrayElements(role.achievements, 2);
  const mentored = f.number.int({ min: 2, max: 6 });

  // A realistic, multi-sentence description (about 450 characters): good input for the AI summary.
  const experience =
    `${years} years of experience as a ${role.position}, building ${role.domain}. ` +
    `Currently at ${f.company.name()}, where I led ${project1} and work every day with ${skills.join(", ")}. ` +
    `Previously at ${f.company.name()}, I delivered ${project2} and mentored ${mentored} junior colleagues. ` +
    `Highlights: ${achievement1}, and ${achievement2}. ` +
    `I enjoy small cross-functional teams, clear documentation and careful code and design reviews.`;

  const candidate = repo.create({
    fullName: `${firstName} ${lastName}`,
    email: `${`${firstName}.${lastName}`.toLowerCase().replace(/[^a-z.]/g, "")}.${index + 1}@example.com`,
    phone: `+1 ${f.string.numeric(3)} ${f.string.numeric(3)} ${f.string.numeric(4)}`,
    position: role.position,
    yearsOfExperience: years,
    skills,
    experience,
    status: STATUSES[(index + 1) % STATUSES.length],
  });

  // The first 3 already have an AI summary, so the demo shows both states ("has summary" / "no summary yet").
  if (index < 3) {
    candidate.aiSummary = [
      `- ${years} years of experience as a ${role.position}, focused on ${role.domain}.`,
      `- Key skills: ${skills.join(", ")}.`,
      `- Led ${project1} and delivered ${project2}.`,
      `- Achievements: ${achievement1}; ${achievement2}.`,
    ].join("\n");
    candidate.summarizedAt = new Date();
  }
  return candidate;
}

async function seed() {
  fakerEN.seed(2026);
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(Candidate);

  // Only remove previously seeded rows (example.com), so real candidates you added are kept
  // and running the seed again never creates duplicates.
  await AppDataSource.query(`DELETE FROM "candidates" WHERE "email" LIKE '%@example.com'`);

  const vietnamese = makeVietnameseCandidates(repo);
  const english = Array.from({ length: 10 }, (_, i) => makeEnglishCandidate(repo, i));

  await repo.save([...vietnamese, ...english]);
  console.log(
    `Seeded ${vietnamese.length} Vietnamese + ${english.length} English fake candidates.`,
  );
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
