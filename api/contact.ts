// Vercel Edge Function — handles the contact form submission.
// Served at /api/contact (same origin as the site, so no CORS).
// Sends the message via the Resend REST API. Configure these as
// environment variables in Vercel → Project → Settings → Environment Variables:
//   RESEND_API_KEY      — your Resend API key (secret)
//   CONTACT_TO_EMAIL    — inbox that receives the messages (e.g. info@academiaguitarraporto.pt)
//   CONTACT_FROM_EMAIL  — verified sender (e.g. contacto@academiaguitarraporto.pt;
//                         use onboarding@resend.dev for testing before domain verification)

export const config = { runtime: 'edge' };

interface ContactPayload {
  nome?: string;
  email?: string;
  telemovel?: string;
  assunto?: string;
  mensagem?: string;
  rgpd?: string;
  website?: string; // honeypot — must stay empty
  form_time?: string; // page-load timestamp (ms) for bot timing check
}

const MIN_FILL_TIME_MS = 3000; // forms submitted faster than this are treated as bots

const ASSUNTO_LABELS: Record<string, string> = {
  inscricao: 'Inscrição',
  informacoes: 'Informações',
  'experience-pack': 'Experience Pack',
  parceria: 'Parceria',
  outro: 'Outro',
};

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const isValidEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return json({ success: false, message: 'Método não permitido.' }, 405);
  }

  let data: ContactPayload;
  try {
    data = await request.json();
  } catch {
    return json({ success: false, message: 'Pedido inválido.' }, 400);
  }

  // Honeypot: a filled "website" field means a bot. Pretend success so we don't tip it off.
  if (data.website && data.website.trim() !== '') {
    return json({ success: true });
  }

  // Timing check: a real human takes more than a few seconds to fill the form.
  const formTime = Number(data.form_time);
  if (Number.isFinite(formTime) && Date.now() - formTime < MIN_FILL_TIME_MS) {
    return json({ success: true });
  }

  // Required-field validation.
  const nome = data.nome?.trim() ?? '';
  const email = data.email?.trim() ?? '';
  const telemovel = data.telemovel?.trim() ?? '';
  const assunto = data.assunto?.trim() ?? '';
  const mensagem = data.mensagem?.trim() ?? '';

  if (!nome || !email || !telemovel || !assunto || !data.rgpd) {
    return json({ success: false, message: 'Preenche todos os campos obrigatórios.' }, 400);
  }
  if (!isValidEmail(email)) {
    return json({ success: false, message: 'Email inválido.' }, 400);
  }

  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_TO_EMAIL;
  const fromEmail = process.env.CONTACT_FROM_EMAIL;
  if (!apiKey || !toEmail || !fromEmail) {
    console.error('Contact form misconfigured: missing RESEND_API_KEY / CONTACT_TO_EMAIL / CONTACT_FROM_EMAIL');
    return json({ success: false, message: 'Serviço de email não configurado.' }, 500);
  }

  const assuntoLabel = ASSUNTO_LABELS[assunto] ?? assunto;
  const html = `
    <h2>Nova mensagem do site — Academia de Guitarra do Porto</h2>
    <p><strong>Nome:</strong> ${escapeHtml(nome)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Telemóvel:</strong> ${escapeHtml(telemovel)}</p>
    <p><strong>Assunto:</strong> ${escapeHtml(assuntoLabel)}</p>
    <p><strong>Mensagem:</strong><br>${mensagem ? escapeHtml(mensagem).replace(/\n/g, '<br>') : '(sem mensagem)'}</p>
  `;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Academia de Guitarra do Porto <${fromEmail}>`,
        to: [toEmail],
        reply_to: email,
        subject: `[AGP] ${assuntoLabel} — ${nome}`,
        html,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error('Resend API error:', res.status, detail);
      return json({ success: false, message: 'Não foi possível enviar a mensagem.' }, 502);
    }

    return json({ success: true });
  } catch (err) {
    console.error('Contact form send failed:', err);
    return json({ success: false, message: 'Não foi possível enviar a mensagem.' }, 502);
  }
}
