import { LaborExtractedFields } from '@/types/agents';

/**
 * Traduz os JSONS massivos vindos do Jusbrasil ou do extrator de PDF
 * para o formato unificado de Extração Trabalhista da Agile.
 */
export function parseLaborCaseData(
  supabaseCaseData: any,
  externalRawData: any,
  documentTextData: string[]
): LaborExtractedFields {
  
  const extracted: LaborExtractedFields = {
    process_number: supabaseCaseData?.process_number,
    tribunal: supabaseCaseData?.tribunal,
    court_region: supabaseCaseData?.court_region,
    claimant_name: supabaseCaseData?.leads?.full_name,
    defendant_company: supabaseCaseData?.defendant_company,
    process_stage: supabaseCaseData?.process_stage,
    identified_value: supabaseCaseData?.estimated_value
  };

  // 1. Sobrepor com dados do Escavador se existirem
  if (externalRawData) {
    // Tribunal
    if (externalRawData.tribunal || externalRawData.sigla_tribunal) {
      extracted.tribunal = externalRawData.tribunal || externalRawData.sigla_tribunal?.sigla || externalRawData.sigla_tribunal;
    }
    
    // Orgãos (ex: 2ª Vara do Trabalho...) - No escavador muitas vezes vem em font.orgao_julgador ou no array fontes
    if (externalRawData.fontes && Array.isArray(externalRawData.fontes) && externalRawData.fontes.length > 0) {
       extracted.court_region = externalRawData.fontes[0].orgao_julgador || externalRawData.fontes[0].nome;
    }

    // Identificação de Partes (Polo Passivo, Réu)
    if (externalRawData.envolvidos && Array.isArray(externalRawData.envolvidos)) {
      const def = externalRawData.envolvidos.find((p: any) => p.tipo?.toLowerCase()?.includes('passivo') || p.tipo_normalizado === 'Reu');
      if (def?.nome) {
        extracted.defendant_company = def.nome;
      }
    }

    // Fase Processual (No Escavador, normalmente vem em "estado" ou derivado das movimentações)
    if (externalRawData.estado) {
      extracted.process_stage = externalRawData.estado;
    }

    // Valor da causa no processo original
    if (externalRawData.valor) {
      // Escavador devolve .valor
      const val = parseFloat(externalRawData.valor);
      if (!isNaN(val)) extracted.identified_value = val;
    }

    // Inferências sobre Movimentações (Sentença/Acórdão/Execução) - No escavador ficam muitas vezes em fontes[].movimentacoes ou na raiz
    let movs = externalRawData.movimentacoes || [];
    if (movs.length === 0 && externalRawData.fontes) {
        externalRawData.fontes.forEach((f: any) => {
            if (f.movimentacoes) movs = movs.concat(f.movimentacoes);
        });
    }

    if (movs.length > 0) {
      const movsText = movs.map((m: any) => (m.titulo || m.tipo) + ' ' + (m.conteudo || '')).join(' ').toLowerCase();
      
      extracted.has_sentence = movsText.includes('sentença') || movsText.includes('julgado procedente');
      extracted.has_acordao = movsText.includes('acórdão') || movsText.includes('recurso ordinário conhecido');
      extracted.has_execution_signals = movsText.includes('execução') || movsText.includes('penhora') || movsText.includes('bacenjud') || movsText.includes('sisbajud') || movsText.includes('cálculos homologados');
      
      // Criar sumário das últimas três movimentações (se existirem) para o analista
      const ultimas = movs.slice(0, 3).map((m: any) => m.titulo || m.tipo || 'Movimentação').join(', ');
      if (ultimas) extracted.relevant_movements_summary = ultimas;
    }
  }

  // 2. Extração básica hipotética dos Documentos associados ao caso
  if (documentTextData && documentTextData.length > 0) {
    const fullDocText = documentTextData.join(' ').toLowerCase();
    
    if (!extracted.has_sentence && fullDocText.includes('sentença')) extracted.has_sentence = true;
    if (!extracted.has_acordao && fullDocText.includes('acórdão')) extracted.has_acordao = true;
    
    // Tenta encontrar "R$" seguido de valor se o extracted.identified_value for nulo
    if (!extracted.identified_value) {
       const match = fullDocText.match(/r\$\s*([\d\.,]+)/);
       if (match && match[1]) {
           const cleanedVal = match[1].replace(/\./g, '').replace(',', '.');
           const val = parseFloat(cleanedVal);
           if (!isNaN(val) && val > 0) extracted.identified_value = val;
       }
    }
  }

  return extracted;
}
