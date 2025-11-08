/**
 * 🔐 ARQUIVO DE EXEMPLO - COPIE PARA config.js E CONFIGURE
 * 
 * cp config.example.js config.js
 */

const CONFIG = {
    // OpenAI API
    OPENAI_API_KEY: 'sk-proj-...', // Sua chave OpenAI (https://platform.openai.com/api-keys)
    OPENAI_MODEL: 'gpt-4o', // Modelo mais recente com visão (mais rápido e barato)
    
    // ElevenLabs API (mesma do Mestre Hikari)
    ELEVENLABS_API_KEY: '', // Sua chave ElevenLabs
    ELEVENLABS_VOICE_ID: '', // ID da voz do Mestre Hikari
    
    // Configurações de análise
    ANALYSIS: {
        // Frequência de envio para análise (ms)
        // 0 = manual (apenas quando clicar no botão)
        autoAnalyzeInterval: 0,
        
        // Confiança mínima do MediaPipe (0-1)
        minPoseConfidence: 0.5,
        
        // Incluir imagem na análise? (Vision)
        includeImage: true,
        
        // Qualidade da imagem (0-1, menor = mais leve/rápido)
        imageQuality: 0.6,
        
        // CAPTURA DE SEQUÊNCIA (MOVIMENTO)
        captureSequence: true,              // true = captura múltiplos frames (movimento), false = 1 foto apenas (pose)
        sequenceDuration: 5,                // Duração da gravação em segundos (recomendado: 5-10s)
        framesPerSecond: 2,                 // Frames por segundo (recomendado: 1-3 fps, mais que isso fica caro!)
                                            // Exemplo: 5s x 2fps = 10 imagens enviadas para GPT-4o
    },
    
    // Debug mode
    DEBUG: true
};

// Validação básica
if (CONFIG.OPENAI_API_KEY === 'sk-proj-...') {
    console.warn('⚠️ Configure sua chave da OpenAI em config.js');
}

if (!CONFIG.ELEVENLABS_API_KEY) {
    console.warn('⚠️ Configure sua chave da ElevenLabs em config.js');
}

