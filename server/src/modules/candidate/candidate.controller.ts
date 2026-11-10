import type { Request, Response } from "express";
import type { ListQuery } from "./candidate.schema";
import * as candidateService from "./candidate.service";

export async function list(_req: Request, res: Response) {
  const result = await candidateService.listCandidates(res.locals.query as ListQuery);
  res.json(result);
}

export async function getOne(req: Request<{ id: string }>, res: Response) {
  res.json(await candidateService.getCandidate(req.params.id));
}

export async function create(req: Request, res: Response) {
  res.status(201).json(await candidateService.createCandidate(req.body));
}

export async function update(req: Request<{ id: string }>, res: Response) {
  res.json(await candidateService.updateCandidate(req.params.id, req.body));
}

export async function updateStatus(req: Request<{ id: string }>, res: Response) {
  res.json(await candidateService.updateCandidateStatus(req.params.id, req.body.status));
}

export async function summarize(req: Request<{ id: string }>, res: Response) {
  res.json(await candidateService.summarizeCandidate(req.params.id));
}

export async function remove(req: Request<{ id: string }>, res: Response) {
  await candidateService.deleteCandidate(req.params.id);
  res.status(204).send();
}
