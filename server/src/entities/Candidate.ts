import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export enum CandidateStatus {
  NEW = "NEW",
  CONTACTED = "CONTACTED",
  SHORTLISTED = "SHORTLISTED",
  REJECTED = "REJECTED",
}

@Entity("candidates")
export class Candidate {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  fullName!: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 255 })
  email!: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  phone!: string | null;

  @Column({ type: "varchar", length: 255 })
  position!: string;

  @Column({ type: "int", default: 0 }) // 0–50
  yearsOfExperience!: number;

  @Column({ type: "text", array: true, default: () => "'{}'" })
  skills!: string[];

  @Column({ type: "text", default: "" })
  experience!: string;

  @Index()
  @Column({ type: "enum", enum: CandidateStatus, default: CandidateStatus.NEW })
  status!: CandidateStatus;

  @Column({ type: "text", nullable: true })
  aiSummary!: string | null;

  @Column({ type: "timestamptz", nullable: true })
  summarizedAt!: Date | null;

  @Index()
  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
