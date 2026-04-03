import { supabase } from '@/lib/supabase';

/**
 * Módulo de leitura de Documentos (PDF, Imagens) anexados ao Processo.
 * Neste momento, opera como um mock expansível.
 *
 * Exemplo de uso de lib de OCR a introduzir no futuro:
 * - pdf-parse
 * - AWS Textract
 * - Tesseract.js / OpenAI Vision
 */

export async function extractTextFromCaseDocuments(caseId: string): Promise<string[]> {
  try {
    // 1. Ir buscar os documentos anexos ao caso
    const { data: documents, error } = await supabase
      .from('documents')
      .select('id, document_type, document_url')
      .eq('case_id', caseId);

    if (error) {
      console.error(`[DocumentReader] Erro ao buscar documentos do caso ${caseId}:`, error);
      return [];
    }

    if (!documents || documents.length === 0) {
      return [];
    }

    const extractedTexts: string[] = [];

    // 2. Map simulado da leitura de PDFs. 
    // Em cenário real: faríamos download do file_url e convertíamos via buffer.
    for (const doc of documents) {
      // Mock de extração baseado no tipo (só para testar a pipeline do Parser)
      if (doc.document_type === 'sentenca') {
         // O Extrator leu este texto do PDF
         extractedTexts.push('Vistos etc. RELATÓRIO... julgado PROCEDENTE O PEDIDO DA RECLAMANTE... e condeno a reclamada a pagar a quantia de R$ 35.000,00...');
      } else if (doc.document_type === 'acordao') {
         extractedTexts.push('ACÓRDÃO... recurso ordinário deferido... valor da causa mantido.');
      } else if (doc.document_type === 'oficio_requisitorio') {
         extractedTexts.push('OFÍCIO REQUISITÓRIO... PRECATÓRIO NATUREZA ALIMENTAR... INSS... VALOR A REQUISITAR R$ 123.456,80... ORÇAMENTO 2024');
      } else {
         // Se não for pré-programado, enviamos um dummy vazio.
         extractedTexts.push(`document_type=${doc.document_type}`); 
      }
    }

    return extractedTexts;
  } catch (e: any) {
    console.error('[DocumentReader] Falha fatal a ler documentos:', e.message);
    return [];
  }
}
