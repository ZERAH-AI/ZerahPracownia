const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());

// Webhook odbierający wiadomości od Dust
app.post("/webhook", async (req, res) => {
  console.log("📦 Pełne body:", JSON.stringify(req.body, null, 2));

  const message = req.body?.content;
  const conversation_id =
    req.body?.conversation?.id ||
    req.body?.conversation_id ||
    req.body?.external_conversation_id ||
    req.body?.conversationId;

  console.log("📥 Odebrano wiadomość:", message);
  console.log("🧾 ID rozmowy:", conversation_id);

  const reply = req.body?.reply || "Brak odpowiedzi od Dusta.";

  // Jeśli nie ma conversation_id, nie wysyłamy wiadomości
  if (!conversation_id) {
    console.error("❌ Brak conversation_id. Nie można wysłać odpowiedzi.");
    return res.status(400).send("conversation_id is required");
  }

  try {
    // Wysyłanie odpowiedzi do Chatwoot
    const response = await axios.post(
      `${process.env.CHATWOOT_BASE_URL}/api/v1/accounts/${process.env.CHATWOOT_ACCOUNT_ID}/conversations/${conversation_id}/messages`,
      {
        content: reply,
        message_type: "outgoing",
      },
      {
        headers: {
          api_access_token: process.env.CHATWOOT_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Wysłano odpowiedź do Chatwoot:", reply);
    res.status(200).send("OK");
  } catch (error) {
    console.error("❌ Błąd przy wysyłaniu do Chatwoot:", error.message);
    res.status(500).send("Error sending to Chatwoot");
  }
});

// 🚀 Uruchomienie serwera
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
