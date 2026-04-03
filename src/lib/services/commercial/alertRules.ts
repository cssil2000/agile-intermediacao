import { 
  CommercialNotificationResult, 
  CommercialAlertType, 
  CommercialAlertPriority, 
  NotifyRole 
} from '@/types/agents';

interface LogicSnapshot {
  value: number;
  eligibility_status: string;
  recommended_action: string;
  priority_label: string;
  lead_type: string;
  overall_score: number;
}

export function determineCommercialAlertInfo(snapshot: LogicSnapshot): Omit<CommercialNotificationResult, 'commercial_summary'> {
  
  let type: CommercialAlertType = 'sem_alerta_comercial';
  let priority: CommercialAlertPriority = 'baixa';
  let roles: NotifyRole[] = [];
  let reason = 'Análise neutra. Casos sem apelo iminente ou abaixo da linha métrica.';
  let commercialStatus = 'pendente';
  let shouldAlert = false;

  const { value, eligibility_status, priority_label, lead_type, recommended_action } = snapshot;

  // RULE 1: Filtro Rápido - Lixo Comercial
  if (eligibility_status === 'rejeitado' || recommended_action === 'rejeicao_provavel' || value < 50000) {
      if (value < 50000 && eligibility_status !== 'rejeitado') {
         reason = 'Silenciado: Valor inferir a R$ 50 mil não tem atratividade de ROI comercial.';
         commercialStatus = 'arquivado_budget';
      } else {
         reason = 'Silenciado: O motor de risco detetou anomalias fatais (Rejeição direta).';
         commercialStatus = 'rejeitado';
      }
      return { should_create_alert: false, alert_type: type, alert_priority: priority, notify_roles: roles, alert_reason: reason, commercial_status: commercialStatus };
  }

  // RULE 2: Avaliação Suprema - Alerta Imediato
  if (value > 3000000 || priority_label === 'premium') {
      type = 'alerta_imediato';
      priority = 'critica';
      roles = ['socios', 'analista', 'comercial'];
      reason = 'Mega Deal: Valor na casa dos Milhões e/ou Score de ativo super premium mapeado. Mobilização total.';
      commercialStatus = 'alerta_red_direcao';
      shouldAlert = true;
  }
  // RULE 3: Casos Bons para a Fila Comercial Diária
  else if (eligibility_status === 'aprovado_automaticamente' || recommended_action === 'pronto_para_comercial' || priority_label === 'alta') {
      type = 'alerta_normal';
      priority = lead_type === 'advogado' ? 'alta' : 'media';
      roles = ['analista', 'comercial'];
      reason = 'Fast-Track: Documentação viável e scores positivos validam a prospeção imediata deste Lead.';
      commercialStatus = 'pronto_mesa_comercial';
      shouldAlert = true;
  }
  // RULE 4: Zona Cinzenta (Precisa de Documentação, mas vale o tempo?)
  else if (eligibility_status === 'revisao_humana' || recommended_action === 'encaminhar_para_revisao_humana') {
      if (value >= 150000) {
         type = 'alerta_normal';
         priority = 'media';
         roles = ['analista'];
         reason = 'Hold: Caso atrativo financeiramente mas a necessitar de braço humano técnico antes de avançar comercial.';
         commercialStatus = 'mesa_analise_secundaria';
         shouldAlert = true;
      } else {
         type = 'sem_alerta_comercial';
         reason = 'Silenciado: O risco de esforço vs valor (inferior a R$ 150k) num caso bloqueado na IA não compensa alerta de push.';
         commercialStatus = 'aguarda_acao_organica';
         shouldAlert = false;
      }
  }

  return {
    should_create_alert: shouldAlert,
    alert_type: type,
    alert_priority: priority,
    notify_roles: roles,
    alert_reason: reason,
    commercial_status: commercialStatus
  };
}
