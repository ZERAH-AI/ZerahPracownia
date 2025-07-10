// index.js - Railway Dust + Chatwoot Integration (Zaktualizowany kod)

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
        agentId: 'XxANDnN74a', // Backup Agent ID - zaktualizuj po teście /test/agents
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

// POPRAWIONA funkcja do wywołania Dust Agent @ZERAH
async function callDustAgent(message, username = 'Chatwoot User', conversationId = null) {
    try {
        // Najpierw utwórz nową konwersację
        const conversationResponse = await axios.post(
            `${CONFIG.dust.baseUrl}/w/${CONFIG.dust.workspaceId}/assistant/conversations`,
            {
                title: `Chatwoot: ${username}`,
                visibility: "private"
            },
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.dust.apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const newConversationId = conversationResponse.data.conversation.sId;
        console.log(`Created conversation: ${newConversationId}`);

        // Następnie wyślij wiadomość do konwersacji z @ZERAH
        const messageResponse = await axios.post(
            `${CONFIG.dust.baseUrl}/w/${CONFIG.dust.workspaceId}/assistant/conversations/${newConversationId}/messages`,
            {
                content: message,
                mentions: [
                    {
                        configurationId: CONFIG.dust.agentName // Spróbuj najpierw z nazwą
                    }
                ],
                context: {
                    username: username,
                    timezone: "Europe/Warsaw",
                    fullName: username,
                    email: "chatwoot@zerah.online",
                    origin: "api"
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.dust.apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('Message sent successfully to Dust');
        return messageResponse.data;

    } catch (error) {
        console.error('Dust API Error:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            url: error.config?.url
        });

        // Jeśli nazwa nie działa, spróbuj z ID
        if (error.response?.status === 404 || error.response?.status === 400) {
            try {
                console.log('Retrying with agent ID...');
                
                // Utwórz nową konwersację dla retry
                const retryConversationResponse = await axios.post(
                    `${CONFIG.dust.baseUrl}/w/${CONFIG.dust.workspaceId}/assistant/conversations`,
                    {
                        title: `Chatwoot Retry: ${username}`,
                        visibility: "private"
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${CONFIG.dust.apiKey}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                const retryConversationId = retryConversationResponse.data.conversation.sId;

                const retryMessageResponse = await axios.post(
                    `${CONFIG.dust.baseUrl}/w/${CONFIG.dust.workspaceId}/assistant/conversations/${retryConversationId}/messages`,
                    {
                        content: message,
                        mentions: [
                            {
                                configurationId: CONFIG.dust.agentId // Użyj backup ID
                            }
                        ],
                        context: {
                            username: username,
                            timezone: "Europe/Warsaw",
                            fullName: username,
                            email: "chatwoot@zerah.online",
                            origin: "api"
                        }
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${CONFIG.dust.apiKey}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                
                console.log('Retry successful');
                return retryMessageResponse.data;
            } catch (retryError) {
                console.error('Retry failed:', retryError.response?.data);
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
            testAgents: 'GET /test/agents',
            testZerah: 'GET /test/zerah',
            testWorkspace: 'GET /test/workspace',
            health: 'GET /health'
        },
        config: {
            dustAgent: CONFIG.dust.agentName,
            dustWorkspace: CONFIG.dust.workspaceId,
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

// NOWY: Sprawdź dostępnych agentów - WAŻNE dla znalezienia @ZERAH
app.get('/test/agents', async (req, res) => {
    try {
        const response = await axios.get(
            `${CONFIG.dust.baseUrl}/w/${CONFIG.dust.workspaceId}/assistant/agent_configurations`,
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.dust.apiKey}`
                }
            }
        );
        
        const agents = response.data.agentConfigurations || [];
        const zerahAgent = agents.find(agent => 
            agent.name.toLowerCase().includes('zerah') || 
            agent.sId.toLowerCase().includes('zerah')
        );

        res.json({
            success: true,
            message: 'Agents retrieved successfully',
            totalAgents: agents.length,
            zerahAgent: zerahAgent || 'ZERAH agent not found',
            currentConfig: {
                agentName: CONFIG.dust.agentName,
                agentId: CONFIG.dust.agentId
            },
            allAgents: agents.map(agent => ({
                name: agent.name,
                sId: agent.sId,
                status: agent.status,
                scope: agent.scope
            }))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            details: error.response?.data
        });
    }
});

// NOWY: Test workspace
app.get('/test/workspace', async (req, res) => {
    try {
        const response = await axios.get(
            `${CONFIG.dust.baseUrl}/w/${CONFIG.dust.workspaceId}/spaces`,
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.dust.apiKey}`
                }
            }
        );
        
        res.json({
            success: true,
            workspaceId: CONFIG.dust.workspaceId,
            spacesCount: response.data.spaces?.length || 0,
            spaces: response.data.spaces
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            details: error.response?.data
        });
    }
});

// NOWY: Test specjalnie dla @ZERAH
app.get('/test/zerah', async (req, res) => {
    try {
        const testMessage = req.query.message || 'Cześć ZERAH! To jest test z Railway dla agenta ZERAH.';
        console.log(`Testing ZERAH agent with message: ${testMessage}`);
        
        const response = await callDustAgent(testMessage, 'Railway Test User');
        
        res.json({
            success: true,
            message: 'ZERAH agent test successful!',
            testMessage,
            dustResponse: response,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'ZERAH agent test failed',
            error: error.message,
            details: error.response?.data,
            timestamp: new Date().toISOString()
        });
    }
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
            workspaceId: CONFIG.dust.workspaceId,
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
        console.log(`Testing with message: ${testMessage}`);
        
        const response = await callDustAgent(testMessage, 'Test User');
        
        res.json({
            success: true,
            testMessage,
            dustResponse: response,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            details: error.response?.data,
            timestamp: new Date().toISOString()
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

            // Wywołaj Dust Agent @ZERAH
            const dustResponse = await callDustAgent(messageContent, senderName, conversationId);

            // Wyślij odpowiedź z powrotem do Chatwoot
            if (dustResponse && dustResponse.content) {
                await sendChatwootMessage(
                    conversationId, 
                    dustResponse.content || 'Przepraszam, wystąpił problem z odpowiedzią.',
                    'outgoing'
                );
                
                console.log('Response sent to Chatwoot successfully');
            }

            res.json({ 
                success: true, 
                processed: true,
                conversationId: conversationId,
                agent: CONFIG.dust.agentName
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
            agent: CONFIG.dust.agentName,
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
    console.log(`🧪 Test endpoints:`);
    console.log(`   - /test/agents (find ZERAH agent)`);
    console.log(`   - /test/zerah (test ZERAH specifically)`);
    console.log(`   - /test/workspace`);
    console.log(`   - /test/chatwoot`);
    console.log(`   - /test/dust-simple`);
    console.log(`💬 Chatwoot URL: ${CONFIG.chatwoot.apiUrl}`);
    console.log(`🎯 Dust Agent: ${CONFIG.dust.agentName} (ID: ${CONFIG.dust.agentId})`);
    console.log(`🌍 App URL: https://zerahpracownia-production.up.railway.app`);
});

module.exports = app;
