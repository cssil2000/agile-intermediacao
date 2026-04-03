/**
 * Ordem canónica de execução dos agentes da Agile Intermediação.
 */
export const AGENT_PIPELINE_ORDER = [
  'capture_normalization_agent',
  'legal_extraction_agent',
  'eligibility_agent',
  'risk_scoring_agent',
  'executive_summary_agent',
  'commercial_notification_agent',
  'pending_recontact_agent'
];

/**
 * Obtém os agentes que devem ser executados após um determinado agente.
 */
export function getAgentsFollowing(agentName: string): string[] {
  const index = AGENT_PIPELINE_ORDER.indexOf(agentName);
  if (index === -1) return [];
  return AGENT_PIPELINE_ORDER.slice(index + 1);
}
