const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());

app.post("/webhook", async (req, res) => {
  console.log("📦 Pełne body:", JSON.stringify(req.body, null, 2));

  const message = req.body?.content || req.body?.message || req.body?.input;
  const conversation_id =
    req.body?.conversation?.id ||
    req.body?.conversation_id ||
    req.body?.external_conversation_id ||
    req.body?.conversationId;

  console.log("📥 Odebrano wiadomość:", message);
  console.log("🧾 ID rozmowy:", conversation_id);

  if (!conversation_id || !message) {
    console.error("❌ Brak danych wejściowych.");
    return res.status(400).send("Missing message or conversation_id");
  }

  if (
    !process.env.DUST_API_KEY ||
    !process.env.DUST_PROJECT_ID ||
    !process.env.DUST_SPEC_HASH
  ) {
    console.error("❌ Brakuje zmiennych Dust.");
    return res.status(500).send("Dust environment variables missing");
  }

  let reply = "Brak odpowiedzi od AI.";

  // 1️⃣ Wysyłka do Dust
  try {
    const dustResponse = await axios.post(
      `https://dust.tt/api/v1/projects/${process.env.DUST_PROJECT_ID}/runs`,
      {
        specification_hash: process.env.DUST_SPEC_HASH,
        inputs: {
          message: message,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.DUST_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    reply = dustResponse.data.run.output;
    console.log("🤖 Odpowiedź z Dust:", reply);
  } catch (error) {
    console.error("❌ Błąd Dust:", error.response?.data || error.message);
  }

  // 2️⃣ Wysyłka odpowiedzi do Chatwoot
  if (
    !process.env.CHATWOOT_API_URL ||
    !process.env.CHATWOOT_API_KEY ||
    !process.env.CHATWOOT_ACCOUNT_ID
  ) {
    console.error("❌ Brakuje zmiennych Chatwoot.");
    return res.status(500).send("Chatwoot environment variables missing");
  }

  try {
    const url = `${process.env.CHATWOOT_API_URL}/api/v1/accounts/${process.env.CHATWOOT_ACCOUNT_ID}/conversations/${conversation_id}/messages`;
    console.log("➡️ Wysyłam odpowiedź do Chatwoot:", url);

    await axios.post(
      url,
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

    console.log("✅ Odpowiedź wysłana do Chatwoot.");
    res.status(200).send("OK");
  } catch (error) {
    console.error("❌ Błąd przy wysyłaniu do Chatwoot:", error.response?.data || error.message);
    res.status(500).send("Error sending message to Chatwoot");
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Serwer działa na porcie ${PORT}`);
});

