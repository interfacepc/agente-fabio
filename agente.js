const express = require('express');
const app = express();
app.use(express.json());

// Rota que recebe as mensagens do WhatsApp
app.post('/webhook', (req, res) => {
  console.log('--- ALGO CHEGOU NO WEBHOOK! ---');
  console.log('Dados recebidos:', JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});

// Rota para testar no navegador
app.get('/webhook', (req, res) => {
  res.send('O Agente está ouvindo e pronto para receber mensagens!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`>>> AGENTE DE TESTE ONLINE NA PORTA ${PORT} <<<`);
});
