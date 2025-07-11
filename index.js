// index.js - Railway Dust + Chatwoot Integration (wersja App API)

const express = require('express');
const axios = require('axios');
const app = express();

// Konfiguracja z Railway Environment Variables
const CONFIG = {
    // Dust Configuration
    dust: {
        workspaceId: process.env.DUST_WORKSPACE_ID || 'VZuYxk8oJc',
        apiKey: process.env.DUST_API_KEY || 'sk-...',
        agentName: process.env.DUST_NAME || 'ZERAH',
        appId: process.env.DUST_APP_ID || 'mhmm8HSWpr', // <-- TO NOWE
        baseUrl: 'https://dust.tt/api/v1'
    },
    // Chatwoot Configuration
    chatwoot: {
        accountId: process.env.CHATWOOT_ACCOUNT_ID || '1',
        apiKey: process.env.CHATWOOT_API_KEY || 'your_chatwoot_token',
        apiUrl: process.env.CHATWOOT_API_URL || 'https://chatzerah.online',
        baseUrl: function () {
            return `${this.apiUrl}/api/v1/accounts/${this.accountId}`;
        }
    },
    port: process.env.PORT || 8080
};

app.use(express.json());

// 🔁 NOWA FUNKCJA: Wywołanie Dust App
async function callDustApp(message) {
    try {
        const workspaceId = CONFIG.dust.workspaceId;
        const appId = CONFIG.dust.appId;
        const url = `https://dust.tt/api/v1/w/${workspaceId}/spaces/${workspaceId}/apps/${appId}/runs`;

        const response = await axios.post(
            url,
            { input: { message } },
            {
                headers: {
                    Authorization: `Bearer ${CONFIG.dust.apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const reply = response.data?.blocks?.ZERAH?.output?.content || "Brak odpowiedzi.";
        return { content: reply };

    } catch (error) {
        console.error('❌ Dust App API Error:', error.response?.data || error.message);
        throw error;
    }
}

// 💬 Odpowiedź do Chatwoot
async function sendChatwootMessage(conversationId, message, messageType = 'outgoing') {
    try {
        const response = await axios.post(
            `${CONFIG.chatwoot.baseUrl()}/conversations/${conversationId}/messages`,
            {
                content: message,
                message_type: messageType,
                private: false
            },
            {
                headers: {
                    'api_access_token': CONFIG.chatwoot.apiKey,
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data;
    } catch (error) {
        console.error('Chatwoot API Error:', error.response?.data || error.message);
        throw error;
    }
}

// 🌐 Webhook z Chatwoot
app.post('/webhook/chatwoot', async (req, res) => {
    try {
        const { event, conversation, message_created } = req.body;

        if (
            event === 'message_created' &&
            message_created &&
            message_created.message_type === 'incoming' &&
            !message_created.private
        ) {
            const conversationId = conversation.id;
            const messageContent = message_created.content;
            const senderName = message_created.sender?.name || 'Klient';

            console.log(`💬 Wiadomość od ${senderName}: ${messageContent}`);

            const dustResponse = await callDustApp(messageContent);

            if (dustResponse && dustResponse.content) {
                await sendChatwootMessage(
                    conversationId,
                    dustResponse.content,
                    'outgoing'
                );

                console.log('✅ Odpowiedź wysłana do Chatwoot');
            }

            res.json({
                success: true,
                processed: true,
                conversationId: conversationId,
                source: 'Dust App'
            });
        } else {
            res.json({
                success: true,
                processed: false,
                reason: 'Ignorowany event',
                event: event
            });
        }
    } catch (error) {
        console.error('❌ Błąd webhooka:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 🔍 Test endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        app: 'Railway Chatwoot → Dust App',
        timestamp: new Date().toISOString(),
        workspaceId: CONFIG.dust.workspaceId,
        appId: CONFIG.dust.appId
    });
});

app.listen(CONFIG.port, '0.0.0.0', () => {
    console.log(`🚀 Server działa na porcie ${CONFIG.port}`);
});
