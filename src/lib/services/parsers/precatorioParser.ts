import { PrecatorioExtractedFields } from '@/types/agents';

/**
 * Traduz e cruza informações de Precatórios preenchidas nos formulários 
 * e extraídas dos PDFs anexos, consolidando num único perfil.
 */
export function parsePrecatorioData(
  supabaseCaseData: any,
  documentTextData: string[]
): PrecatorioExtractedFields {
  
  const extracted: PrecatorioExtractedFields = {
    precatorio_number: supabaseCaseData?.precatorio_number,
    court_origin: supabaseCaseData?.court_origin || supabaseCaseData?.tribunal,
    public_entity: supabaseCaseData?.public_entity,
    credit_nature: supabaseCaseData?.credit_nature,
    estimated_face_value: supabaseCaseData?.estimated_face_value || supabaseCaseData?.estimated_value,
    payment_year: supabaseCaseData?.payment_year,
    priority_right: supabaseCaseData?.priority_right,
    lawyer_name: supabaseCaseData?.lawyer_name,
    lawyer_contact: supabaseCaseData?.lawyer_contact
  };

  // Extração básica hipotética dos Documentos associados (ex: Ofício Requisitório, Certidão)
  if (documentTextData && documentTextData.length > 0) {
    const fullDocText = documentTextData.join(' ').toLowerCase();
    
    // Identificar ano de requisição se não existir (procura 202X ou 201X perto da palavra 'precatório' ou 'ofício')
    if (!extracted.payment_year) {
      const anoMatch = fullDocText.match(/orçamento\s+(?:de\s+)?(20[12]\d)/);
      if (anoMatch && anoMatch[1]) {
        extracted.payment_year = parseInt(anoMatch[1], 10);
      }
    }

    // Identificar Natureza Alimentar vs Comum
    if (!extracted.credit_nature) {
      if (fullDocText.includes('alimentar') || fullDocText.includes('alimentício')) {
        extracted.credit_nature = 'Alimentar';
      } else if (fullDocText.includes('comum') || fullDocText.includes('não alimentar')) {
        extracted.credit_nature = 'Comum';
      }
    }

    // Ente devedor (lógica regex simples para simulação. Num sistema real, usaríamos um modelo LLM ou NER para capturar isto de forma precisa)
    if (!extracted.public_entity) {
      if (fullDocText.includes('inss') || fullDocText.includes('instituto nacional do seguro social')) {
        extracted.public_entity = 'INSS (Federal)';
      } else if (fullDocText.includes('estado de são paulo') || fullDocText.includes('fazenda do estado')) {
        extracted.public_entity = 'Estado de São Paulo (Estadual)';
      } else if (fullDocText.includes('união federal')) {
         extracted.public_entity = 'União Federal';
      }
    }

    // Tentativa de achar o valor de face do Ofício
    if (!extracted.estimated_face_value) {
      const matchValor = fullDocText.match(/[vV]alor.*?(?:r\$|reais).*?([\d\.,]+)/);
      if (matchValor && matchValor[1]) {
          const cleanedVal = matchValor[1].replace(/\./g, '').replace(',', '.');
          const val = parseFloat(cleanedVal);
          if (!isNaN(val) && val > 0) extracted.estimated_face_value = val;
      }
    }
  }

  return extracted;
}
