const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());

app.post("/webhook", async (req, res) => {
  const message = req.body?.content;
  const conversation_id = req.body?.conversation_id;

  console.log("Received message:", message);

  // 🔁 Jeśli Dust przesyła gotową odpowiedź:
  const reply = req.body?.reply || "Brak odpowiedzi od Dusta.";

  try {
    // 💬 Wyślij wiadomość do Chatwoot
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

    console.log("Wysłano odpowiedź do Chatwoot:", reply);
    res.sendStatus(200);
  } catch (err) {
    console.error("Error sending to Chatwoot:", err.response?.data || err.message);
    res.sendStatus(500);
  }
});

// Testowa strona GET
app.get("/", (req, res) => {
  res.send("ZerahWebhook działa 🚀");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
