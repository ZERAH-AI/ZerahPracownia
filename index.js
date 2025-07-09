import express from "express";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8080;

app.post("/webhook", async (req, res) => {
  try {
    const message = req.body.content;
    const conversationId = req.body.conversation.id;

    console.log("📥 Odebrano wiadomość:", message);
    console.log("🆔 ID rozmowy:", conversationId);

    const dustResponse = await axios.post(
      `https://dust.tt/api/v1/w/${process.env.DUST_WORKSPACE_ID}/assistant/conversations`,
      {
        name: `Chatwoot-${conversationId}`,
        messages: [
          {
            role: "user",
            content: message,
          },
        ],
        agentId: process.env.DUST_AGENT_ID,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.DUST_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const reply =
      dustResponse.data.messages?.[dustResponse.data.messages.length - 1]?.content || "Brak odpowiedzi od AI";

    console.log("📤 Wysyłam odpowiedź do Chatwoot:", reply);

    await axios.post(
      `${process.env.CHATWOOT_API_URL}/api/v1/accounts/${process.env.CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}/messages`,
      {
        content: reply,
        message_type: "outgoing",
      },
      {
        headers: {
          api_access_token: process.env.CHATWOOT_API_KEY,
        },
      }
    );

    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Błąd:", error?.response?.data || error.message);
    res.sendStatus(500);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Serwer działa na porcie ${PORT}`);
});
