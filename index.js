// index.js - Railway Dust + Chatwoot Integration (Kompletny kod)
const express = require('express');
const axios = require('axios');
const app = express();

// Konfiguracja z Railway Environment Variables
const CONFIG = {
    // Dust Configuration
    dust: {
        workspaceId: process.env.DUST_WORKSPACE_ID || 'VZuYxk8oJc',
        apiKey: process.env.DUST_API_KEY || 'sk-e2ebddefecce8e1fbae40cbe95607986',
        agentName: process.env.DUST_NAME || 'ZERAH',
        agentId: 'XxANDnN74a', // Backup Agent ID
        baseUrl: 'https://dust.tt/api/v1'
    },
    // Chatwoot Configuration
    chatwoot: {
        accountId: process.env.CHATWOOT_ACCOUNT_ID || '1',
        apiKey: process.env.CHATWOOT_API_KEY || 'poiaC1rG2Sj14hHMmFrzdz23',
        apiUrl: process.env.CHATWOOT_API_URL || 'https://chatzerah.online',
        baseUrl: function() { return `${this.apiUrl}/api/v1/accounts/${this.accountId}`; }
    },
    port: process.env.PORT || 8080
};

app.use(express.json());

// Poprawiona funkcja do wywołania Dust Agent
async function callDustAgent(message, username = 'Chatwoot User', conversationId = null) {
    try {
        const response = await axios.post(
            `${CONFIG.dust.baseUrl}/w/${CONFIG.dust.workspaceId}/assistant/conversations`,
            {
                message: message,
                blocking: true,
                agentConfigurationId: CONFIG.dust.agentName
            },
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.dust.apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data;
    } catch (error) {
        console.error('Dust API Error:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            url: error.config?.url
        });
        
        // Spróbuj z Agent ID jeśli nazwa nie działa
        if (error.response?.status === 404) {
            try {
                const retryResponse = await axios.post(
                    `${CONFIG.dust.baseUrl}/w/${CONFIG.dust.workspaceId}/assistant/conversations`,
                    {
                        message: message,
                        blocking: true,
                        agentConfigurationId: CONFIG.dust.agentId
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${CONFIG.dust.apiKey}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                return retryResponse.data;
            } catch (retryError) {
                console.error('Dust API Retry Error:', retryError.response?.data);
                throw retryError;
            }
        }
        throw error;
    }
}

// Funkcja do wysłania wiadomości do Chatwoot
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

// Endpoint główny
app.get('/', (req, res) => {
    res.json({
        message: 'Railway Dust + Chatwoot Integration Server - WORKING! 🚀',
        timestamp: new Date().toISOString(),
        endpoints: {
            chatwootWebhook: 'POST /webhook/chatwoot',
            dustWebhook: 'POST /webhook/dust',
            testDust: 'GET /test?message=your_message',
            testChatwoot: 'GET /test/chatwoot',
            testDustSimple: 'GET /test/dust-simple',
            health: 'GET /health'
        },
        config: {
            dustAgent: CONFIG.dust.agentName,
            chatwootAccount: CONFIG.chatwoot.accountId,
            port: CONFIG.port
        }
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        config: {
            dust: {
                workspaceId: CONFIG.dust.workspaceId,
                agentName: CONFIG.dust.agentName,
                agentId: CONFIG.dust.agentId,
                hasApiKey: !!CONFIG.dust.apiKey,
                baseUrl: CONFIG.dust.baseUrl
            },
            chatwoot: {
                accountId: CONFIG.chatwoot.accountId,
                apiUrl: CONFIG.chatwoot.apiUrl,
                hasApiKey: !!CONFIG.chatwoot.apiKey,
                baseUrl: CONFIG.chatwoot.baseUrl()
            },
            port: CONFIG.port
        }
    });
});

// Prosty test Dust API - sprawdza połączenie
app.get('/test/dust-simple', async (req, res) => {
    try {
        const response = await axios.get(
            `${CONFIG.dust.baseUrl}/w/${CONFIG.dust.workspaceId}/assistant/agent_configurations`,
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.dust.apiKey}`
                }
            }
        );

        res.json({
            success: true,
            message: 'Dust API connection works!',
            agentsCount: response.data.agentConfigurations?.length || 0,
            agents: response.data.agentConfigurations?.map(a => ({ 
                name: a.name, 
                sId: a.sId,
                status: a.status 
            })) || []
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            status: error.response?.status,
            details: error.response?.data
        });
    }
});

// Test Dust Agent - wysyła wiadomość
app.get('/test', async (req, res) => {
    try {
        const testMessage = req.query.message || 'Cześć ZERAH! To jest test z Railway.';
        const response = await callDustAgent(testMessage, 'Test User');
        
        res.json({
            success: true,
            testMessage,
            dustResponse: response
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            details: error.response?.data
        });
    }
});

// Test Chatwoot connection
app.get('/test/chatwoot', async (req, res) => {
    try {
        const response = await axios.get(
            `${CONFIG.chatwoot.baseUrl()}/conversations`,
            {
                headers: {
                    'api_access_token': CONFIG.chatwoot.apiKey
                }
            }
        );

        res.json({
            success: true,
            chatwootConnected: true,
            conversationsCount: response.data.data?.length || 0,
            config: {
                accountId: CONFIG.chatwoot.accountId,
                apiUrl: CONFIG.chatwoot.apiUrl
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            chatwootConnected: false,
            error: error.message
        });
    }
});

// Webhook dla Chatwoot
app.post('/webhook/chatwoot', async (req, res) => {
    try {
        const { event, conversation, message_created } = req.body;
        
        console.log('Chatwoot webhook received:', { 
            event, 
            conversationId: conversation?.id,
            messageType: message_created?.message_type 
        });

        // Reaguj tylko na nowe wiadomości od klientów
        if (event === 'message_created' && 
            message_created && 
            message_created.message_type === 'incoming' &&
            !message_created.private) {
            
            const conversationId = conversation.id;
            const messageContent = message_created.content;
            const senderName = message_created.sender?.name || 'Customer';
            
            console.log(`Processing message from ${senderName}: ${messageContent}`);

            // Wywołaj Dust Agent
            const dustResponse = await callDustAgent(messageContent, senderName, conversationId);

            // Wyślij odpowiedź z powrotem do Chatwoot
            if (dustResponse && dustResponse.message) {
                await sendChatwootMessage(
                    conversationId, 
                    dustResponse.message.content || 'Przepraszam, wystąpił problem z odpowiedzią.',
                    'outgoing'
                );
                
                console.log('Response sent to Chatwoot successfully');
            }

            res.json({ 
                success: true, 
                processed: true,
                conversationId: conversationId 
            });
        } else {
            // Ignoruj inne typy eventów
            res.json({ 
                success: true, 
                processed: false, 
                reason: 'Event ignored',
                event: event,
                messageType: message_created?.message_type 
            });
        }

    } catch (error) {
        console.error('Chatwoot webhook error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Webhook dla bezpośrednich wywołań Dust
app.post('/webhook/dust', async (req, res) => {
    try {
        const { message, user, conversationId } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        console.log('Direct Dust webhook:', { message, user });

        const dustResponse = await callDustAgent(message, user || 'Anonymous', conversationId);
        
        res.json({
            success: true,
            response: dustResponse,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Direct webhook error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Start serwera
app.listen(CONFIG.port, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${CONFIG.port}`);
    console.log(`📡 Chatwoot webhook: /webhook/chatwoot`);
    console.log(`🤖 Dust webhook: /webhook/dust`);
    console.log(`🧪 Test endpoints: /test, /test/chatwoot, /test/dust-simple`);
    console.log(`💬 Chatwoot URL: ${CONFIG.chatwoot.apiUrl}`);
    console.log(`🎯 Dust Agent: ${CONFIG.dust.agentName} (ID: ${CONFIG.dust.agentId})`);
    console.log(`🌍 App URL: https://zerahpracownia-production.up.railway.app`);
});

module.exports = app;
