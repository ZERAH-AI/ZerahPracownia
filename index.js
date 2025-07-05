const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());

app.post("/webhook", async (req, res) => {
  const message = req.body?.content;
  const conversation_id =
    req.body?.conversation?.id ||
    req.body?.conversation_id ||
    req.body?.external_conversation_id ||
    req.body?.conversationId;

  console.log("📥 Odebrano wiadomość:", message);
  console.log("🧾 ID rozmowy:", conversation_id);

  if (!conversation_id || !message) {
    console.error("⛔ Brakuje danych wejściowych");
    return res.status(400).send("conversation_id and message are required");
  }

  try {
    // 🔄 Wyślij wiadomość do Dust i czekaj na odpowiedź
    const dustResponse = await axios.post(
      "https://dust.tt/api/v1/apps/YOUR_APP_ID/run",
      {
        inputs: { message }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.DUST_API_KEY}`
        }
      }
    );

    const reply =
      dustResponse.data?.outputs?.[0]?.text?.value ||
      "Brak odpowiedzi od Dusta.";

    console.log("🤖 Odpowiedź Dusta:", reply);

    // 💬 Odeślij do Chatwoot
    await axios.post(
      `${process.env.CHATWOOT_API_URL}/api/v1/accounts/${process.env.CHATWOOT_ACCOUNT_ID}/conversations/${conversation_id}/messages`,
      {
        content: reply,
        message_type: "outgoing"
      },
      {
        headers: {
          api_access_token: process.env.CHATWOOT_API_KEY
        }
      }
    );

    console.log("✅ Wysłano odpowiedź do Chatwoot");
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Błąd:", err.response?.data || err.message);
    res.sendStatus(500);
  }
});

app.get("/", (req, res) => {
  res.send("ZerahWebhook działa 🚀");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));


// Nasłuch na porcie
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Serwer nasłuchuje na porcie ${PORT}`));
