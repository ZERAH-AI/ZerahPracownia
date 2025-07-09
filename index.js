const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());

app.post("/webhook", async (req, res) => {
  const message = req.body?.content || req.body?.message || req.body?.input;
  const conversation_id =
    req.body?.conversation?.id ||
    req.body?.conversation_id ||
    req.body?.external_conversation_id ||
    req.body?.conversationId;

  console.log("📥 Odebrano wiadomość:", message);
  console.log("🧾 ID rozmowy:", conversation_id);

  if (!message || !conversation_id) {
    return res.status(400).send("Missing message or conversation_id");
  }

  try {
    // 1. Utwórz nową rozmowę w Dust z wiadomością od użytkownika
    const dustConversation = await axios.post(
      `https://dust.tt/api/v1/w/${process.env.DUST_WORKSPACE_ID}/assistant/conversations`,
      {
        name: "Chatwoot Conversation",
        messages: [{ role: "user", content: message }],
        settings: { include_sources: false },
        agent: process.env.DUST_AGENT_NAME,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.DUST_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    // 2. Pobierz conversation ID z Dust
    const dustConvId = dustConversation.data?.conversation?.id;
    console.log("🧠 Dust Conversation ID:", dustConvId);

    // 3. Poczekaj chwilę na odpowiedź (albo zapytaj endpoint "events" dla pełnej wersji)
    await new Promise((r) => setTimeout(r, 2000));

    // 4. Pobierz odpowiedź z Dust
    const eventsRes = await axios.get(
      `https://dust.tt/api/v1/w/${process.env.DUST_WORKSPACE_ID}/assistant/conversations/${dustConvId}/events`,
      {
        headers: {
          Authorization: `Bearer ${process.env.DUST_API_KEY}`,
        },
      }
    );

    const reply = eventsRes.data.events.find((e) => e.type === "message" && e.message.role === "assistant")?.message
      ?.content || "Brak odpowiedzi od AI.";

    console.log("🤖 Odpowiedź Dust:", reply);

    // 5. Wyślij odpowiedź z powrotem do Chatwoot
    const chatwootUrl = `${process.env.CHATWOOT_API_URL}/api/v1/accounts/${process.env.CHATWOOT_ACCOUNT_ID}/conversations/${conversation_id}/messages`;

    await axios.post(
      chatwootUrl,
      {
        content: reply,
        message_type: "outgoing",
      },
      {
        headers: {
          api_access_token: process.env.CHATWOOT_TOKEN,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Wysłano odpowiedź do Chatwoot:", reply);
    res.status(200).send("OK");
  } catch (error) {
    console.error("❌ Błąd:", error.response?.data || error.message);
    res.status(500).send("Wystąpił błąd");
  }
});

// Serwer
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Serwer działa na porcie ${PORT}`);
});
