import type { Company } from "./model.ts";
import { DomainError } from "./errors.ts";

export const TRIAL_DAYS = 7;
const DAY = 24 * 60 * 60 * 1000;
export function newTrial(now = new Date()): NonNullable<Company["trial"]> {
  return {
    startedAt: now.toISOString(),
    endsAt: new Date(now.getTime() + TRIAL_DAYS * DAY).toISOString(),
  };
}
export function trialState(company: Pick<Company, "trial">, now = new Date()) {
  const trial = company.trial;
  if (!trial || trial.convertedAt) return null;
  const remaining = Date.parse(trial.endsAt) - now.getTime();
  return {
    expired: remaining <= 0 || !Number.isFinite(remaining),
    daysLeft: Math.max(0, Math.ceil(remaining / DAY)),
    endsAt: trial.endsAt,
  };
}
export function requireActiveTrial(company: Pick<Company, "trial">, now = new Date()) {
  if (trialState(company, now)?.expired)
    throw new DomainError(
      "Seu teste de 7 dias terminou. Solicite a ativação de um plano à central para continuar.",
    );
}
