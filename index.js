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

  if (!conversation_id) {
    console.error("❌ Brak conversation_id. Nie można wysłać odpowiedzi.");
    return res.status(400).send("conversation_id is required");
  }

  // Sprawdzenie zmiennych Dust
  if (
    !process.env.DUST_API_KEY ||
    !process.env.DUST_PROJECT_ID ||
    !process.env.DUST_SPEC_HASH
  ) {
    console.error("❌ Brakuje zmiennych środowiskowych dla Dust.");
    return res.status(500).send("Missing Dust environment variables");
  }

  let reply = "Brak odpowiedzi od AI";

  try {
    console.log("🧠 Wysyłam zapytanie do Dust...");

    const dustResponse = await axios.post(
      `https://dust.tt/api/v1/projects/${process.env.DUST_PROJECT_ID}/apps/${process.env.DUST_SPEC_HASH}/run`,
      {
        inputs: [{ USER_INPUT: message }],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.DUST_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const output = dustResponse.data?.outputs?.[0]?.MODEL_OUTPUT?.[0]?.content;

    if (output) {
      reply = output;
      console.log("✅ Odpowiedź z Dust:", reply);
    } else {
      console.warn("⚠️ Brak odpowiedzi w formacie MODEL_OUTPUT.");
    }
  } catch (err) {
    console.error("❌ Błąd Dust:", err.response?.data || err.message);
  }

  if (
    !process.env.CHATWOOT_API_URL ||
    !process.env.CHATWOOT_API_KEY ||
    !process.env.CHATWOOT_ACCOUNT_ID
  ) {
    console.error("❌ Brakuje zmiennych środowiskowych Chatwoot.");
    return res.status(500).send("Missing Chatwoot environment variables");
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

    console.log("✅ Wysłano odpowiedź do Chatwoot:", reply);
    res.status(200).send("OK");
  } catch (error) {
    console.error(
      "❌ Błąd przy wysyłaniu do Chatwoot:",
      error.response?.data || error.message
    );
    res.status(500).send("Error sending message to Chatwoot");
  }
});

// Serwer Express
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Serwer działa na porcie ${PORT}`);
});
