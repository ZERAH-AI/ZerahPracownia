const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());

app.post("/webhook", async (req, res) => {
  const message = req.body?.content;
  const conversation_id = req.body?.conversation_id;
  console.log("Received message:", message);

  try {
   const response = await axios.post(
  "https://dust.tt/api/v1/assistants/YBVHdJa3Bc/run",
  {
    input: {
      USER_INPUT: message
    }
  },
  {
    headers: {
      Authorization: `Bearer ${process.env.DUST_API_KEY}`
    }
  }
);

const reply = response.data.outputs?.[0]?.value || "Brak odpowiedzi.";

    console.log("Reply from Dust:", reply);

    // Send message back to Chatwoot
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

    res.sendStatus(200);
  } catch (err) {
    console.error("Error:", err.response?.data || err.message);
    res.sendStatus(500);
  }
});

app.get("/", (req, res) => {
  res.send("ZerahWebhook działa 🚀");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
