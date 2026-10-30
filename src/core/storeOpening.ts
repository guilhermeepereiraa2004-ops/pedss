import { openState } from "./domain.ts";
import { deliveryConfigured, shippingMode } from "./shipping.ts";
import { trialState } from "./trials.ts";
import type { Company, Tenant } from "./model.ts";

export type OpeningIssue = {
  code: "trial" | "paused" | "fulfillment" | "schedule";
  title: string;
  message: string;
  target: "shipping" | "settings" | "central";
  action: string;
};

/** Management guidance uses the same eligibility and clock as the public storefront. */
export function storeOpeningStatus(company: Company, tenant: Tenant, now = new Date()) {
  const blockers: OpeningIssue[] = [];
  if (trialState(company, now)?.expired)
    blockers.push({
      code: "trial",
      title: "O período de teste terminou",
      message: "Peça à central para ativar um plano antes de voltar a receber pedidos.",
      target: "central",
      action: "Ver situação na central",
    });
  if (company.archived || company.status === "Pausado")
    blockers.push({
      code: "paused",
      title: "Loja pausada pela central",
      message:
        "A central precisa reativar o estabelecimento. O botão de abrir não remove essa pausa.",
      target: "central",
      action: "Ver situação na central",
    });
  const settings = tenant.settings;
  if (!settings.pickupEnabled && !deliveryConfigured(settings))
    blockers.push({
      code: "fulfillment",
      title: "Falta configurar o atendimento",
      message:
        settings.deliveryEnabled && shippingMode(settings) === "areas"
          ? "A entrega está ativada, mas não há áreas de entrega salvas. Em Frete, escolha e salve uma taxa única, configure o frete por km ou cadastre uma área. Outra opção é habilitar retirada com o endereço da loja."
          : "Em Frete, habilite e salve pelo menos uma opção: entrega com a taxa configurada ou retirada com o endereço da loja.",
      target: "shipping",
      action: "Configurar frete e retirada",
    });
  const availability = openState(company, tenant, now);
  const enabledAvailability = openState(company, { ...tenant, online: true }, now);
  const schedule: OpeningIssue | null =
    !blockers.length && !enabledAvailability.open
      ? {
          code: "schedule",
          title: "Fora do horário de funcionamento",
          message: `O horário automático está ativo (${settings.timezone}). A loja recebe pedidos nos dias e horários salvos em Configurações. Ativar o atendimento mantém essa programação; não abre a loja fora do horário.`,
          target: "settings",
          action: "Revisar horários",
        }
      : null;
  return { availability, blockers, schedule };
}
