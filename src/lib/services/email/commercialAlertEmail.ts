import { Resend } from 'resend';
import { CommercialSummaryPayload, CommercialAlertType, CommercialAlertPriority } from '@/types/agents';

const resend = new Resend(process.env.RESEND_API_KEY);

const ALERT_RECIPIENTS = [
  'danielle@agileintermediacao.com.br',
  'cssil2000@gmail.com'
];

const FROM_ADDRESS = 'Agile Intermediação <alertas@agileintermediacao.com.br>';

interface SendAlertEmailParams {
  caseId: string;
  alertType: CommercialAlertType;
  alertPriority: CommercialAlertPriority;
  alertReason: string;
  payload: CommercialSummaryPayload;
}

export async function sendCommercialAlertEmail(params: SendAlertEmailParams): Promise<{ success: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY não configurado. Email não enviado.');
    return { success: false, error: 'RESEND_API_KEY não configurado' };
  }

  const { caseId, alertType, alertPriority, alertReason, payload } = params;

  const isImmediate = alertType === 'alerta_imediato';
  const subject = isImmediate
    ? `🔴 ALERTA IMEDIATO — ${payload.asset_type === 'trabalhista' ? 'Trabalhista' : 'Precatório'} ${formatCurrency(payload.value)} | Agile`
    : `🟡 Novo Caso para Mesa Comercial — ${formatCurrency(payload.value)} | Agile`;

  const html = buildEmailHtml({ ...params, isImmediate });

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: ALERT_RECIPIENTS,
      subject,
      html
    });

    if (error) {
      console.error('[Email] Resend retornou erro:', error);
      return { success: false, error: error.message };
    }

    console.log(`[Email] Alerta comercial enviado para ${ALERT_RECIPIENTS.join(', ')} — Caso ${caseId}`);
    return { success: true };

  } catch (err: any) {
    console.error('[Email] Falha ao enviar via Resend:', err);
    return { success: false, error: err.message };
  }
}

function buildEmailHtml(params: SendAlertEmailParams & { isImmediate: boolean }): string {
  const { caseId, alertPriority, alertReason, payload, isImmediate } = params;

  const accentColor = isImmediate ? '#dc2626' : '#ca8a04';
  const badgeColor = isImmediate ? '#fef2f2' : '#fefce8';
  const badgeText = isImmediate ? '🔴 ALERTA IMEDIATO' : '🟡 FILA COMERCIAL';
  const assetLabel = payload.asset_type === 'trabalhista' ? 'Crédito Trabalhista' : 'Precatório';
  const entityLabel = payload.asset_type === 'trabalhista' ? 'Empresa Ré' : 'Ente Devedor';

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alerta Comercial — Agile Intermediação</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);border:1px solid #334155;border-radius:12px 12px 0 0;padding:28px 32px;text-align:center;">
              <p style="margin:0 0 4px 0;font-size:11px;letter-spacing:3px;color:#64748b;text-transform:uppercase;">Agile Intermediação</p>
              <h1 style="margin:0;font-size:20px;font-weight:700;color:#f1f5f9;letter-spacing:-0.5px;">Sistema de Alertas Comerciais</h1>
            </td>
          </tr>

          <!-- Badge de Prioridade -->
          <tr>
            <td style="background-color:#1e293b;border-left:1px solid #334155;border-right:1px solid #334155;padding:16px 32px 0;">
              <div style="display:inline-block;background-color:${badgeColor};border:1px solid ${accentColor};border-radius:6px;padding:6px 14px;">
                <span style="font-size:13px;font-weight:700;color:${accentColor};">${badgeText}</span>
              </div>
            </td>
          </tr>

          <!-- Dados principais -->
          <tr>
            <td style="background-color:#1e293b;border-left:1px solid #334155;border-right:1px solid #334155;padding:24px 32px;">

              <!-- Valor em destaque -->
              <div style="background:linear-gradient(135deg,#0f172a,#1a2744);border:1px solid #cca43b;border-radius:10px;padding:20px 24px;margin-bottom:20px;text-align:center;">
                <p style="margin:0 0 4px 0;font-size:11px;letter-spacing:2px;color:#94a3b8;text-transform:uppercase;">Valor Estimado</p>
                <p style="margin:0;font-size:32px;font-weight:800;color:#cca43b;letter-spacing:-1px;">${formatCurrency(payload.value)}</p>
                <p style="margin:4px 0 0 0;font-size:13px;color:#64748b;">${assetLabel} · Prioridade <strong style="color:#e2e8f0;">${payload.priority_label.toUpperCase()}</strong></p>
              </div>

              <!-- Grid de dados -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                  <td width="50%" style="padding:0 8px 12px 0;vertical-align:top;">
                    ${dataCard('Cliente', payload.lead_name)}
                  </td>
                  <td width="50%" style="padding:0 0 12px 8px;vertical-align:top;">
                    ${dataCard(entityLabel, payload.entity)}
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="padding:0 8px 12px 0;vertical-align:top;">
                    ${dataCard('Risco Jurídico', payload.risk.toUpperCase())}
                  </td>
                  <td width="50%" style="padding:0 0 12px 8px;vertical-align:top;">
                    ${dataCard('Próximo Passo', payload.next_step)}
                  </td>
                </tr>
              </table>

              <!-- Resumo Executivo -->
              <div style="background-color:#0f172a;border-left:3px solid #cca43b;border-radius:0 6px 6px 0;padding:14px 16px;margin-bottom:20px;">
                <p style="margin:0 0 6px 0;font-size:11px;letter-spacing:2px;color:#64748b;text-transform:uppercase;">Resumo da IA</p>
                <p style="margin:0;font-size:14px;color:#cbd5e1;line-height:1.6;">${payload.summary}</p>
              </div>

              <!-- Razão do Alerta -->
              <div style="background-color:#1e293b;border:1px solid #334155;border-radius:6px;padding:14px 16px;">
                <p style="margin:0 0 6px 0;font-size:11px;letter-spacing:2px;color:#64748b;text-transform:uppercase;">Motivo do Alerta</p>
                <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.5;">${alertReason}</p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#0f172a;border:1px solid #334155;border-top:none;border-radius:0 0 12px 12px;padding:20px 32px;text-align:center;">
              <p style="margin:0 0 4px 0;font-size:12px;color:#475569;">ID do Caso: <code style="color:#94a3b8;background:#1e293b;padding:2px 6px;border-radius:4px;">${caseId}</code></p>
              <p style="margin:0;font-size:11px;color:#334155;">Agile Intermediação · Sistema Automatizado de Alertas</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function dataCard(label: string, value: string): string {
  return `
    <div style="background-color:#0f172a;border:1px solid #334155;border-radius:6px;padding:12px 14px;">
      <p style="margin:0 0 4px 0;font-size:10px;letter-spacing:2px;color:#64748b;text-transform:uppercase;">${label}</p>
      <p style="margin:0;font-size:14px;font-weight:600;color:#e2e8f0;">${value || '—'}</p>
    </div>
  `;
}

function formatCurrency(value: number): string {
  if (!value) return 'Valor não informado';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
