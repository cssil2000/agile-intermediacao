import { supabase } from '@/lib/supabase';
import { getCaseWithDetails, updateCaseAndLeadFields } from '../cases/case-service';
import { createActivityLog, recordAgentRun, updateAgentRun } from '../logs/log-service';
import { queryExternalProcessByCNJ } from '../../tools/legal-tools';
import { extractTextFromCaseDocuments } from '../documents/documentReader';
import { parseLaborCaseData } from '../parsers/laborCaseParser';
import { parsePrecatorioData } from '../parsers/precatorioParser';
import { LegalExtractionAgentOutput, LegalExtractionResult, ConfidenceLevel, RerunMetadata } from '@/types/agents';

/**
 * Ponto de entrada do Agente Mestre de Extração Jurídica e Documental.
 */
export async function runLegalExtractionAgent(caseId: string, rerunMetadata?: RerunMetadata): Promise<LegalExtractionAgentOutput> {
  const agentName = 'legal_extraction_agent';
  
  // 1. Registar o início da execução do Agente
  const runId = await recordAgentRun({
    caseId,
    agentName,
    inputPayload: { caseId, rerunMetadata },
    status: 'processing',
    triggerType: rerunMetadata?.triggerType,
    rerunReason: rerunMetadata?.rerunReason,
    triggeredByEmail: rerunMetadata?.triggeredByEmail
  });

  try {
    // 2. Fetch Dados Atuais no Supabase (Base Confiável)
    const { data: caseData, error } = await getCaseWithDetails(caseId);
    if (error || !caseData) {
      return buildErrorResponse(caseId, agentName, 'Falha ao recuperar dados do caso no Supabase.', runId);
    }

    // Preparar variáveis de recolha de dados
    let externalRawData: any = null;
    let documentTexts: string[] = [];
    
    // Summary flags para saída
    const sourceSummary = { supabase: true, escavador: false, documents: false };

    // 3. Consulta Ativa: Escavador (Apenas para Trabalhistas que tenham CNJ)
    if (caseData.asset_type === 'trabalhista' && caseData.process_number) {
      // Limpar o número para a query caso tenha traços/hifens
      const cleanCNJ = caseData.process_number.replace(/[^\d.-]/g, '');
      const extResp = await queryExternalProcessByCNJ(cleanCNJ, caseId);
      if (extResp.success && extResp.data) {
         // Snapshot devolvido diretamente (ou via cache)
         externalRawData = extResp.data;
         sourceSummary.escavador = true;
      }
    }

    // 4. Consulta Ativa: Documentos
    const docs = await extractTextFromCaseDocuments(caseId);
    if (docs.length > 0) {
      documentTexts = docs;
      sourceSummary.documents = true;
    }

    // 5. Encaminhar para o Parser Correto
    let extractedFields: any = {};
    if (caseData.asset_type === 'trabalhista') {
        extractedFields = parseLaborCaseData(caseData, externalRawData, documentTexts);
    } else if (caseData.asset_type === 'precatorio') {
        extractedFields = parsePrecatorioData(caseData, documentTexts);
    } else {
        return buildErrorResponse(caseId, agentName, `Asset type desconhecido: ${caseData.asset_type}`, runId);
    }

    // 6. Triagem de Qualidade, Conflitos e Confiança
    const { 
       missing_critical_fields, 
       conflicting_fields, 
       low_confidence_fields, 
       extraction_confidence 
    } = evaluateExtractionQuality(caseData, extractedFields, sourceSummary);

    // 7. Preparar o JSON de Resposta Oficial
    const result: LegalExtractionResult = {
      asset_type: caseData.asset_type,
      extracted_fields: extractedFields,
      extraction_confidence,
      missing_critical_fields,
      conflicting_fields,
      low_confidence_fields,
      source_summary: sourceSummary
    };

    const needsHumanReview = conflicting_fields.length > 0 || extraction_confidence === 'baixa';

    const response: LegalExtractionAgentOutput = {
      agent_name: agentName,
      case_id: caseId,
      status: 'em_analise', // Status mantém-se em análise em termos de orquestração superior
      result,
      warnings: conflicting_fields.length > 0 ? ['Existem conflitos entre Escavador/Documentos e o painel.'] : [],
      needs_human_review: needsHumanReview,
      log_message: needsHumanReview 
        ? `Extração concluída com confiança ${extraction_confidence}. Há conflitos exigindo revisão humana.`
        : `Extração concluída perfeitamente com confiança ${extraction_confidence}.`
    };

    // 8. Persistência Isolada na tabela de Auditing
    await supabase.from('case_extractions').insert({
      case_id: caseId,
      agent_name: agentName,
      raw_input: { escavador: externalRawData, documents_found: docs.length },
      extracted_fields: result.extracted_fields,
      confidence: result.extraction_confidence,
      warnings: response.warnings
    });

    // 9. Persistência Cautelosa na Tabela Principal Cases 
    // Só atualiza campos que a Agile considera "seguros" (ex. vazios que foram preenchidos agora)
    await persistSafeFields(caseData, extractedFields, conflicting_fields);

    // 10. Atualização de Logs Standard
    await createActivityLog(
      caseId, 
      'extracao_juridica_executada', 
      response.log_message || '',
      'sistema'
    );

    if (runId) {
      await updateAgentRun(runId, {
        outputPayload: response,
        status: 'success'
      });
    }

    return response;

  } catch (err: any) {
    console.error(`[ExtractionAgent] Erro fatal no caso ${caseId}:`, err);
    return buildErrorResponse(caseId, agentName, `Falha interna: ${err.message}`, runId);
  }
}

// --- Funções de Ajuda e Integração ---

function evaluateExtractionQuality(originalCase: any, extracted: any, sources: any) {
  const missing_critical_fields: string[] = [];
  const conflicting_fields: string[] = [];
  const low_confidence_fields: string[] = [];
  let extraction_confidence: ConfidenceLevel = 'baixa';

  if (originalCase.asset_type === 'trabalhista') {
    if (!extracted.process_number) missing_critical_fields.push('process_number');
    if (!extracted.defendant_company) missing_critical_fields.push('defendant_company');
    
    // Conflitos numéricos em "Valor da Causa"
    if (originalCase.estimated_value && extracted.identified_value) {
      if (Math.abs(originalCase.estimated_value - extracted.identified_value) > 1000) {
        conflicting_fields.push('estimated_value');
      }
    }

    // Lógica de Confiança Trabalhista
    if (sources.escavador && sources.documents) extraction_confidence = 'alta';
    else if (sources.escavador || sources.documents) extraction_confidence = 'media';

  } else if (originalCase.asset_type === 'precatorio') {
    if (!extracted.precatorio_number) missing_critical_fields.push('precatorio_number');
    if (!extracted.public_entity) missing_critical_fields.push('public_entity');

    if (originalCase.estimated_face_value && extracted.estimated_face_value) {
       if (Math.abs(originalCase.estimated_face_value - extracted.estimated_face_value) > 1000) {
         conflicting_fields.push('estimated_face_value');
       }
    }

    // Lógica de Confiança Precatório
    if (sources.documents && extracted.public_entity) extraction_confidence = 'alta';
    else if (sources.documents || extracted.public_entity) extraction_confidence = 'media';
  }

  // Se não foi extraído nada via Escavador ou docs, logo temos zero confiança adicional
  if (!sources.escavador && !sources.documents) {
    extraction_confidence = 'baixa';
  }

  return { missing_critical_fields, conflicting_fields, low_confidence_fields, extraction_confidence };
}

async function persistSafeFields(oldData: any, extractedData: any, conflictingFields: string[]) {
  const caseUpdates: Record<string, any> = {};

  // Regra de Ouro: Só substitui valores caso a caso se não for conflituoso.
  // Se está vazio, preenche com o extraído.

  if (oldData.asset_type === 'trabalhista') {
    if (!oldData.process_stage && extractedData.process_stage) caseUpdates.process_stage = extractedData.process_stage;
    if (!oldData.defendant_company && extractedData.defendant_company) caseUpdates.defendant_company = extractedData.defendant_company;
    if (!oldData.tribunal && extractedData.tribunal) caseUpdates.tribunal = extractedData.tribunal;
    
    // Se não há conflito de valor e estava vazio
    if (!oldData.estimated_value && extractedData.identified_value && !conflictingFields.includes('estimated_value')) {
      caseUpdates.estimated_value = extractedData.identified_value;
    }
  }

  if (oldData.asset_type === 'precatorio') {
    if (!oldData.public_entity && extractedData.public_entity) caseUpdates.public_entity = extractedData.public_entity;
    if (!oldData.credit_nature && extractedData.credit_nature) caseUpdates.credit_nature = extractedData.credit_nature;
    if (!oldData.payment_year && extractedData.payment_year) caseUpdates.payment_year = extractedData.payment_year;
    
    // Se não há conflito de valor e estava vazio
    if (!oldData.estimated_face_value && extractedData.estimated_face_value && !conflictingFields.includes('estimated_face_value')) {
      caseUpdates.estimated_face_value = extractedData.estimated_face_value;
    }
  }

  // Prevalecer na BD principal
  if (Object.keys(caseUpdates).length > 0) {
    const caseDataAny: any = oldData;
    const leadId = caseDataAny.lead_id;
    console.log(`[ExtractionAgent] Integrando campos Seguros descobertos na tabela cases para Caso ${oldData.id}.`);
    await updateCaseAndLeadFields(oldData.id, leadId, caseUpdates, {});
  }
}

function buildErrorResponse(caseId: string, agentName: string, message: string, runId: string | null): LegalExtractionAgentOutput {
  const errorResp: LegalExtractionAgentOutput = {
    agent_name: agentName,
    case_id: caseId,
    status: 'erro_interno' as any,
    result: {
      asset_type: 'trabalhista', 
      extracted_fields: {},
      extraction_confidence: 'baixa',
      missing_critical_fields: [],
      conflicting_fields: [],
      low_confidence_fields: [],
      source_summary: { supabase: true, escavador: false, documents: false }
    },
    warnings: [],
    needs_human_review: true,
    log_message: message
  };

  if (runId) {
    updateAgentRun(runId, {
      outputPayload: errorResp,
      status: 'error',
      errorMessage: message
    });
  }

  return errorResp;
}
