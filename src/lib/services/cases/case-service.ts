import { supabase } from '@/lib/supabase';
import { CoreCaseData } from '@/types/agents';

/**
 * Recupera os dados essenciais de um case, incluindo informações agregadas do lead e documentos.
 */
export async function getCaseWithDetails(caseId: string): Promise<{ data?: CoreCaseData; error?: string }> {
  try {
    const { data: caseData, error } = await supabase
      .from('cases')
      .select(`
        id,
        asset_type,
        process_number,
        tribunal,
        court_region,
        case_status,
        lead_id,
        leads:lead_id (
          full_name,
          email,
          phone
        ),
        documents (
          id,
          document_type
        )
      `)
      .eq('id', caseId)
      .single();

    if (error) {
      console.error('[CaseService] Erro ao buscar dados do Case:', error);
      return { error: error.message };
    }

    if (!caseData) {
      return { error: 'Caso não encontrado.' };
    }

    // Tratamento para contornar a forma como o Supabase tipa relacionamentos 1:1
    const leadData = Array.isArray(caseData.leads) ? caseData.leads[0] : caseData.leads;
    
    return {
      data: {
        ...caseData,
        leads: leadData
      } as CoreCaseData
    };
  } catch (err: any) {
    console.error('[CaseService] Erro interno:', err.message);
    return { error: 'Erro interno ao consultar o caso.' };
  }
}

/**
 * Atualiza o status de um case
 */
export async function updateCaseStatus(caseId: string, status: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('cases')
      .update({ case_status: status })
      .eq('id', caseId);

    if (error) {
      console.error(`[CaseService] Erro ao atualizar status do Case ${caseId}:`, error);
      return false;
    }

    console.log(`[CaseService] Case ${caseId} atualizado para status: ${status}`);
    return true;
  } catch (err: any) {
    console.error(`[CaseService] Erro interno ao atualizar status:`, err.message);
    return false;
  }
}

/**
 * Atualiza campos específicos do Case e do Lead se houver alterações
 */
export async function updateCaseAndLeadFields(
  caseId: string, 
  leadId: string | undefined, 
  caseUpdates: Record<string, any>, 
  leadUpdates: Record<string, any>
): Promise<boolean> {
  try {
    // 1. Atualizar Case
    if (Object.keys(caseUpdates).length > 0) {
      const { error: caseError } = await supabase
        .from('cases')
        .update(caseUpdates)
        .eq('id', caseId);
      
      if (caseError) {
        console.error(`[CaseService] Erro ao atualizar campos do Case ${caseId}:`, caseError);
        return false;
      }
    }

    // 2. Atualizar Lead
    if (leadId && Object.keys(leadUpdates).length > 0) {
      const { error: leadError } = await supabase
        .from('leads')
        .update(leadUpdates)
        .eq('id', leadId);
        
      if (leadError) {
        console.error(`[CaseService] Erro ao atualizar campos do Lead ${leadId}:`, leadError);
        return false;
      }
    }

    return true;
  } catch (err: any) {
    console.error(`[CaseService] Erro interno em updateCaseAndLeadFields:`, err.message);
    return false;
  }
}
