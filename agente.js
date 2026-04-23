const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const EVOLUTION_URL = 'https://evolution-api-production-0051.up.railway.app';
const EVOLUTION_KEY = 'fabio-suporte-2026';
const INSTANCE_NAME = 'fabio';
const GEMINI_KEY = 'AIzaSyCLJQ4M5eAobXiRctEhIuVlngnrRoaD77Q';
const EDRISIO = '5535987411647';

const conversas = {};

const PROMPT = `Você é o assistente de suporte técnico de TI do Fábio Galvão.
O Fábio está viajando de 22/04/2026 até 27/04/2026 e você responde por ele no WhatsApp.
Regras:
- Seja simpático, informal e direto. Português do Brasil.
- Se cumprimentarem, explique que o Fábio viajou mas que você pode ajudar.
- Quando o cliente descrever um problema técnico, ofereça de 2 a 4 sugestões numeradas.
- Após as sugestões, pergunte se alguma funcionou.
- Se o cliente disser que NÃO resolveu, responda SOMENTE com: ACIONAR_PLANTONISTA
- Respostas curtas. Sem formatação markdown.`;

async function enviar(numero, texto) {
  await axios.post(
    `${EVOLUTION_URL}/message/sendText/${INSTANCE_NAME}`,
    { number: numero, text: texto },
    { 
      headers: { apikey: EVOLUTION_KEY },
      timeout: 30000
    }
  );
}

async function acionarEdrisio(numeroCliente) {
  await enviar(EDRISIO,
    `Ola Edrisio! Um cliente precisa de suporte urgente.\nNumero: ${numeroCliente}\nPor favor entre em contato!`
  );
  return `Entendido! Vou acionar o plantonista Edrisio agora.\nEle vai entrar em contato em breve. Obrigado pela paciencia!`;
}

async function chamarGemini(numero, mensagem) {
  if (!conversas[numero]) conversas[numero] = [];
  conversas[numero].push({ role: 'user', parts: [{ text: mensagem }] });

  const { data } = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
    {
      system_instruction: { parts: [{ text: PROMPT }] },
      contents: conversas[numero].slice(-10)
    }
  );

  const resposta = data.candidates[0].content.parts[0].text.trim();
  conversas[numero].push({ role: 'model', parts: [{ text: resposta }] });
  return resposta;
}

app.post('/webhook', async (req, res) => {
  res.sendStatus(200);
  const evento = req.body;
  console.log('WEBHOOK RECEBIDO:', JSON.stringify(evento).slice(0, 500));
  if (evento.event !== 'messages.upsert') return;
  const msg = evento.data?.message;
  if (!msg || evento.data?.key?.fromMe) return;

  const numero = evento.data.key.remoteJid.replace('@s.whatsapp.net', '');
  const texto = msg.conversation || msg.extendedTextMessage?.text;
  if (!texto) return;

  try {
    let resposta = await chamarGemini(numero, texto);
    if (resposta.includes('ACIONAR_PLANTONISTA')) {
      resposta = await acionarEdrisio(numero);
    }
    await enviar(numero, resposta);
  } catch (e) {
    console.error('Erro:', e.message);
    await enviar(numero, 'Desculpe, tive um probleminha tecnico. Tente novamente!');
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Agente rodando na porta ${PORT}`));
