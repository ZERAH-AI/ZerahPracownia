const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());

// Webhook odbierający wiadomości od Dust
app.post("/webhook", async (req, res) => {
  console.log("🔍 Pełne body:", JSON.stringify(req.body, null, 2));

  const message = req.body?.content;
  const conversation_id = req.body?.conversation_id || req.body?.external_conversation_id || req.body?.conversationId;

  console.log("📥 Odebrano wiadomość:", message);
  console.log("🧾 ID rozmowy:", conversation_id);

  const reply = req.body?.reply || "Brak odpowiedzi od Dusta.";

  // Jeśli nie ma conversation_id, nie ma sensu wysyłać wiadomości
  if (!conversation_id) {
    console.error("❌ Brak conversation_id. Nie można wysłać odpowiedzi.");
    return res.status(400).send("conversation_id is required");
  }

  try {
    // Wysyłanie odpowiedzi do Chatwoot
    const url = `${process.env.CHATWOOT_API_URL}/api/v1/accounts/${process.env.CHATWOOT_ACCOUNT_ID}/conversations/${conversation_id}/messages`;

    const payload = {
      content: reply,
      message_type: "outgoing"
    };

    const headers = {
      api_access_token: process.env.CHATWOOT_API_KEY
    };

    await axios.post(url, payload, { headers });

    console.log("✅ Wysłano odpowiedź do Chatwoot:", reply);
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Błąd przy wysyłaniu do Chatwoot:", err.response?.data || err.message);
    res.sendStatus(500);
  }
});

// Endpoint testowy GET
app.get("/", (req, res) => {
  res.send("🚀 ZerahWebhook działa!");
});

// Nasłuch na porcie
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Serwer nasłuchuje na porcie ${PORT}`));
