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
        message: 'Railway Dust + Chatwoot Integration Server -
