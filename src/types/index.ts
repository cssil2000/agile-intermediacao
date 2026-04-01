export type AssetType = 'trabalhista' | 'precatorio';
export type CreditNature = 'alimentar' | 'comum' | 'outro';
export type CaseStatus = 'recebido' | 'em_analise' | 'revisao_humana' | 'aprovado' | 'rejeitado' | 'proposta' | 'encerrado';
export type CasePriority = 'baixa' | 'media' | 'alta' | 'premium';
export type LeadType = 'advogado' | 'reclamante' | 'outro';

export interface Lead {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  phone: string;
  lead_type: LeadType;
  status: string;
  source_page?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  notes?: string;
}

export interface Case {
  id: string;
  created_at: string;
  updated_at: string;
  lead_id: string;
  asset_type: AssetType;
  process_number: string;
  internal_reference: string;
  case_status: CaseStatus;
  priority: CasePriority;
  
  // Trabalhista specific
  tribunal?: string;
  court_region?: string;
  defendant_company?: string;
  estimated_value?: number;
  process_stage?: string;
  
  // Precatório specific
  precatorio_number?: string;
  public_entity?: string;
  credit_nature?: CreditNature;
  court_origin?: string;
  estimated_face_value?: number;
  discount_expectation?: number;
  payment_year?: number;
  priority_right?: boolean;
  lawyer_name?: string;
  lawyer_contact?: string;
  
  // AI/Analysis
  score_total?: number;
  ai_summary?: string;
  ai_recommendation?: string;
  risk_level?: string;
  solvency_level?: string;
  
  // Relationships
  lead?: Lead;
}

export interface ActivityLog {
  id: string;
  created_at: string;
  case_id: string;
  event_type: string;
  description: string;
  actor_type: string;
  metadata?: any;
}

export interface AppDocument {
  id: string;
  created_at: string;
  case_id: string;
  document_type?: string;
  file_url?: string;
  file_name?: string;
  file_status: string;
  extracted_text?: string;
}
