const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());

app.post("/webhook", async (req, res) => {
  // 🔍 Loguj pełne body dla debugowania
  console.log("📦 Pełne body:", JSON.stringify(req.body, null, 2));

  const message = req.body?.content;

  const conversation_id =
    req.body?.conversation?.id ||
    req.body?.conversation_id ||
    req.body?.external_conversation_id ||
    req.body?.conversationId;

  console.log("📥 Odebrano wiadomość:", message);
  console.log("🧾 ID rozmowy:", conversation_id);

  // Jeśli brak ID — zakończ
  if (!conversation_id) {
    console.error("❌ Brak conversation_id. Nie można wysłać odpowiedzi.");
    return res.status(400).send("conversation_id is required");
  }

  let reply = "Brak odpowiedzi od Dusta.";

  try {
    // ✅ Zapytanie do Dust
    const response = await axios.post(
      "https://dust.tt/api/v1/run/vlt_CvSgrjpFZuGa/YBVHdJa3Bc",
      {
        inputs: {
          user_input: message
        }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.DUST_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    reply = response.data?.outputs?.[0]?.text || reply;
    console.log("✅ Odpowiedź z Dusta:", reply);
  } catch (err) {
    console.error("❌ Błąd przy zapytaniu do Dusta:", err.response?.data || err.message);
  }

  try {
    // 💬 Wyślij odpowiedź do Chatwoot
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

    console.log("✅ Wysłano odpowiedź do Chatwoot:", reply);
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Błąd wysyłania do Chatwoot:", err.response?.data || err.message);
    res.sendStatus(500);
  }
});

app.get("/", (req, res) => {
  res.send("ZerahWebhook działa 🚀");
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`));

app.listen(PORT, () => console.log(`✅ Serwer nasłuchuje na porcie ${PORT}`));
