export type AssetType = 'trabalhista' | 'precatorio';

export type PipelineType = 'pipeline_trabalhista' | 'pipeline_precatorio';

export type OrchestratorStatus = 'em_analise' | 'pendente_documental' | 'revisao_humana' | 'erro_interno';

export interface OrchestratorInput {
  caseId: string;
}

export interface OrchestratorOutput {
  case_id: string;
  asset_type?: AssetType;
  pipeline_selected?: PipelineType;
  status: OrchestratorStatus;
  next_steps: string[];
  missing_data: string[];
  needs_human_review: boolean;
  log_message: string;
}

export interface AgentRunState {
  caseId: string;
  agentName: string;
  inputPayload: any;
  outputPayload?: any;
  status: 'processing' | 'success' | 'error' | 'failed';
  errorMessage?: string;
  triggerType?: 'automatico' | 'manual' | 'rerun_agente' | 'rerun_pipeline';
  rerunReason?: string;
  triggeredByEmail?: string;
}

export interface RerunMetadata {
  triggerType: 'manual' | 'rerun_agente' | 'rerun_pipeline';
  rerunReason?: string;
  triggeredByEmail?: string;
}

export interface CoreCaseData {
  id: string;
  asset_type: AssetType;
  process_number?: string;
  tribunal?: string;
  court_region?: string;
  precatorio_number?: string;
  case_status: string;
  leads?: {
    full_name: string;
    email: string;
    phone?: string;
  };
  documents?: {
    id: string;
    document_type: string;
  }[];
  lead_id?: string;
}

export type CompletenessLevel = 'alta' | 'media' | 'baixa';

export interface CaptureNormalizationResult {
  asset_type: AssetType;
  normalized_data: Record<string, any>;
  missing_required_fields: string[];
  missing_recommended_fields: string[];
  format_issues: string[];
  consistency_issues: string[];
  completeness_score: number;
  completeness_level: CompletenessLevel;
  ready_for_next_step: boolean;
}

export interface CaptureAgentOutput extends Omit<OrchestratorOutput, 'next_steps' | 'pipeline_selected' | 'missing_data'> {
  agent_name: string;
  result: CaptureNormalizationResult;
  warnings: string[];
}

export type ConfidenceLevel = 'alta' | 'media' | 'baixa';

export interface LaborExtractedFields {
  process_number?: string;
  tribunal?: string;
  court_region?: string;
  claimant_name?: string;
  defendant_company?: string;
  process_stage?: string;
  identified_value?: number;
  has_sentence?: boolean;
  has_acordao?: boolean;
  has_execution_signals?: boolean;
  relevant_movements_summary?: string;
  [key: string]: any;
}

export interface PrecatorioExtractedFields {
  precatorio_number?: string;
  court_origin?: string;
  public_entity?: string;
  credit_nature?: string;
  estimated_face_value?: number;
  payment_year?: number;
  priority_right?: boolean;
  lawyer_name?: string;
  lawyer_contact?: string;
  [key: string]: any;
}

export interface LegalExtractionResult {
  asset_type: AssetType;
  extracted_fields: LaborExtractedFields | PrecatorioExtractedFields;
  extraction_confidence: ConfidenceLevel;
  missing_critical_fields: string[];
  conflicting_fields: string[];
  low_confidence_fields: string[];
  source_summary: {
    supabase: boolean;
    escavador: boolean;
    documents: boolean;
  };
}

export interface LegalExtractionAgentOutput {
  agent_name: string;
  case_id: string;
  status: OrchestratorStatus;
  result: LegalExtractionResult;
  warnings: string[];
  needs_human_review: boolean;
  log_message?: string;
}

export type EligibilityStatus = 'aprovado_automaticamente' | 'revisao_humana' | 'pendente_documental' | 'rejeitado';

export interface EligibilityResult {
  asset_type: AssetType;
  eligibility_status: EligibilityStatus;
  primary_reason: string;
  flags: string[];
  next_action: string;
  needs_human_review: boolean;
}

export interface EligibilityAgentOutput {
  agent_name: string;
  case_id: string;
  status: 'success' | 'error' | 'erro_interno';
  result: EligibilityResult;
  warnings: string[];
}

export type ScoreLevel = 'baixo' | 'medio' | 'alto';
export type PriorityLevel = 'baixa' | 'media' | 'alta' | 'premium';

export interface ScoreBoard {
  legal_risk_score: number;
  financial_risk_score: number;
  commercial_priority_score: number;
  documentation_quality_score: number;
  overall_operational_score: number;
}

export interface ScoreClassifications {
  legal_risk_level: ScoreLevel;
  financial_risk_level: ScoreLevel;
  commercial_priority_level: PriorityLevel;
  documentation_quality_level: ScoreLevel;
  priority_label: PriorityLevel;
}

export interface RiskScoringResult {
  asset_type: AssetType;
  scores: ScoreBoard;
  classifications: ScoreClassifications;
  risk_summary: string;
  flags: string[];
  needs_human_review: boolean;
}

export interface RiskScoringAgentOutput {
  agent_name: string;
  case_id: string;
  status: 'success' | 'error' | 'erro_interno';
  result: RiskScoringResult;
  warnings: string[];
}

export type RecommendedNextAction = 
  | 'encaminhar_para_revisao_humana'
  | 'solicitar_documento_complementar'
  | 'pronto_para_comercial'
  | 'manter_em_analise'
  | 'rejeicao_provavel'
  | 'aguardar_validacao_humana';

export interface ExecutiveSummaryResult {
  asset_type: AssetType;
  executive_summary_short: string;
  executive_summary_full: string;
  recommended_next_action: RecommendedNextAction;
  key_attention_points: string[];
  needs_human_review: boolean;
}

export interface ExecutiveSummaryAgentOutput {
  agent_name: string;
  case_id: string;
  status: 'success' | 'error' | 'erro_interno';
  result: ExecutiveSummaryResult;
  warnings: string[];
}

export type CommercialAlertType = 'alerta_imediato' | 'alerta_normal' | 'sem_alerta_comercial';
export type CommercialAlertPriority = 'baixa' | 'media' | 'alta' | 'critica';
export type NotifyRole = 'socios' | 'analista' | 'comercial';

export interface CommercialSummaryPayload {
  lead_name: string;
  asset_type: AssetType;
  value: number;
  priority_label: string;
  risk: string;
  entity: string;
  summary: string;
  next_step: string;
}

export interface CommercialNotificationResult {
  should_create_alert: boolean;
  alert_type: CommercialAlertType;
  alert_priority: CommercialAlertPriority;
  notify_roles: NotifyRole[];
  alert_reason: string;
  commercial_status: string;
  commercial_summary?: CommercialSummaryPayload;
}

export interface CommercialAgentOutput {
  agent_name: string;
  case_id: string;
  status: 'success' | 'error' | 'erro_interno';
  result: CommercialNotificationResult;
  warnings: string[];
}

export type PendingType = 'falha_oficio' | 'falha_acordao' | 'documentacao_ausente_geral' | 'valor_inconclusivo' | 'nenhuma';
export type PendingRecoveryAction = 'enviar_email' | 'disparar_whatsapp' | 'ignorar_baixo_valor' | 'ignorar_nao_pendente';

export interface PendingContactPayload {
  pending_type: PendingType;
  pending_items: string[];
  pending_recovery_worth: 'alto' | 'baixo' | 'nulo';
  recommended_pending_action: PendingRecoveryAction;
  
  pending_request_subject?: string;
  pending_request_message_short?: string;
  pending_request_message_full?: string;
}

export interface PendingRecontactAgentOutput {
  agent_name: string;
  case_id: string;
  status: 'success' | 'error' | 'erro_interno';
  result: PendingContactPayload;
  warnings: string[];
}
