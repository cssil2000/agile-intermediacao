export function buildPendingMessages(
  leadName: string, 
  assetType: string, 
  missingItems: string[]
): {
  subject: string;
  msgShort: string;
  msgFull: string;
} {
  const firstName = leadName.split(' ')[0] || 'Cliente';
  const assetName = assetType === 'trabalhista' ? 'Processo Trabalhista' : 'Precatório';

  const bulletPoints = missingItems.map(item => `• ${item}`).join('\n');

  // --- 1. Assunto (Normalmente para Emails) ---
  const subject = `Agile Intermediação: Pendência para análise do seu ${assetName}`;

  // --- 2. Short Message (Tipicamente para WhatsApp Push notification) ---
  const msgShort = `Olá ${firstName}! Verificamos o seu registo do ${assetName} na Agile, mas precisamos da documentação que comprova a sua legitimidade para lhe enviar uma proposta de valor. Falta-nos receber:\n${bulletPoints}\nCarga estes ficheiros no nosso portal ou envie por aqui para passarmos ao próximo passo!`;

  // --- 3. Full Message (Email formal / Portal Alert) ---
  const msgFull = `Estimado(a) ${leadName},\n\nAgradecemos o seu registo na plataforma da Agile Intermediação referente ao seu ativo (${assetName}).\n\nNossa tecnologia e equipa de análise efetuaram uma vistoria preliminar cruzada à admissão do processo. De forma a conseguirmos escalar esta oportunidade para os nossos Diretores apresentarem-lhe uma Proposta de Antecipação comercial viável, foi acionado o nosso protocolo de segurança documental, indicando falta da seguinte documentação obrigatória no seu dossier:\n\n${bulletPoints}\n\nA documentação ausente impossibilita neste momento o prosseguimento da negociação.\nAcesso à sua área de cliente ou utilize este canal para indexar a documentação o mais rápido possível.\n\nA Agile Intermediação reitera o seu compromisso em oferecer-lhe a máxima rentabilidade e profissionalismo.\n\nCom os melhores cumprimentos,\nEquipa Operacional da Agile.`;

  return { subject, msgShort, msgFull };
}
