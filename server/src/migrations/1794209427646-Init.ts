import type { MigrationInterface, QueryRunner } from "typeorm";

export class Init1794209427646 implements MigrationInterface {
  name = "Init1794209427646";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."candidates_status_enum" AS ENUM('NEW', 'CONTACTED', 'SHORTLISTED', 'REJECTED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "candidates" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "fullName" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "phone" character varying(50), "position" character varying(255) NOT NULL, "yearsOfExperience" integer NOT NULL DEFAULT '0', "skills" text array NOT NULL DEFAULT '{}', "experience" text NOT NULL DEFAULT '', "status" "public"."candidates_status_enum" NOT NULL DEFAULT 'NEW', "aiSummary" text, "summarizedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_140681296bf033ab1eb95288abb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_c0de76a18c2a505ceb01674682" ON "candidates"  ("email") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d9189257969208c4ffa3a1addc" ON "candidates"  ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7a02f101777eb5c78868da7366" ON "candidates"  ("createdAt") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_7a02f101777eb5c78868da7366"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_d9189257969208c4ffa3a1addc"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c0de76a18c2a505ceb01674682"`);
    await queryRunner.query(`DROP TABLE "candidates"`);
    await queryRunner.query(`DROP TYPE "public"."candidates_status_enum"`);
  }
}
