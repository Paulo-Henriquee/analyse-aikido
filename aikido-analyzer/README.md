# 🥋 Mestre Hikari - Análise de Movimento

Análise em tempo real de posturas e movimentos do Aikidô usando **MediaPipe Pose + GPT-4 Vision**.

---

## 🎯 **O QUE FAZ**

1. **Detecta sua postura** em tempo real usando MediaPipe (33 landmarks do corpo)
2. **Calcula métricas biomecânicas**: ângulos, alinhamentos, centro de gravidade
3. **Captura uma foto** do seu movimento
4. **Envia para GPT-4 Vision** com:
   - Imagem do movimento
   - Dados técnicos (ângulos, distâncias, alinhamento)
   - Contexto da técnica de Aikidô escolhida
5. **Recebe feedback** personalizado do Mestre Hikari
6. **Fala o feedback** usando a voz do Mestre (ElevenLabs)

---

## ⚙️ **CONFIGURAÇÃO**

### 1. **Configure as chaves de API**

Edite o arquivo `config.js`:

```javascript
const CONFIG = {
    OPENAI_API_KEY: 'sk-...', // Sua chave OpenAI
    OPENAI_MODEL: 'gpt-4-vision-preview',
    
    ELEVENLABS_API_KEY: 'sua_chave_elevenlabs',
    ELEVENLABS_VOICE_ID: 'id_da_voz_do_mestre_hikari',
    
    // ...
};
```

### 2. **Técnicas Disponíveis**

- **Ikkyo** (Primeiro Princípio) - Controle do cotovelo
- **Shiho-nage** (Projeção nas 4 Direções) - Elevação e giro
- **Irimi-nage** (Entrar e Projetar) - Entrada no ponto cego
- **Kokyu-ho** (Exercício de Respiração) - Estabilidade e centro

---

## 🚀 **COMO USAR**

### **Localmente:**

```bash
# Servir com Python
python -m http.server 8080

# Ou com Node.js
npx serve -s . -l 8080
```

Acesse: `http://localhost:8080`

### **No Celular:**

1. Acesse a URL (precisa estar na mesma rede ou usar HTTPS)
2. Permita acesso à câmera
3. Escolha a técnica
4. Posicione-se na frente da câmera
5. Clique em **"Analisar Meu Movimento"**
6. Aguarde o feedback visual e falado

---

## 📊 **MÉTRICAS ANALISADAS**

| **Métrica** | **Descrição** |
|-------------|---------------|
| **Ângulo Cotovelo** | Flexão dos cotovelos (importante para Ikkyo) |
| **Ângulo Ombro** | Relação ombro-cotovelo-quadril |
| **Alinhamento** | Desvio entre linha dos ombros e quadril |
| **Centro** | Desvio do centro de gravidade |
| **Base** | Distância entre os pés |
| **Altura Postura** | Relação joelho-ombro (centro baixo) |

---

## 🔐 **SEGURANÇA**

⚠️ **IMPORTANTE:**
- As chaves de API estão expostas no frontend (não ideal para produção)
- Para produção, crie um backend proxy que oculte as chaves
- Este é um projeto de demonstração/palestra

### **Alternativa Segura (Backend Proxy):**

```javascript
// Em vez de chamar OpenAI direto, chame seu backend:
const response = await fetch('https://seu-backend.com/analyze', {
    method: 'POST',
    body: JSON.stringify({ prompt, image })
});
```

---

## 🎨 **CUSTOMIZAÇÃO**

### **Ajustar Precisão:**

```javascript
// config.js
ANALYSIS: {
    minPoseConfidence: 0.7, // Aumentar = mais rigoroso
    imageQuality: 0.8,      // Aumentar = melhor imagem
}
```

### **Mudar Modelo GPT:**

```javascript
OPENAI_MODEL: 'gpt-4-turbo' // Usar só coordenadas (mais rápido/barato)
```

---

## 🐛 **TROUBLESHOOTING**

### **Câmera não funciona:**
- Precisa HTTPS ou localhost
- Verifique permissões do navegador

### **"Configure sua chave...":**
- Edite `config.js` com suas chaves reais

### **Análise muito lenta:**
- Use `gpt-4-turbo` em vez de `gpt-4-vision-preview`
- Diminua `imageQuality` em `config.js`
- Desative imagem: `includeImage: false`

### **Erro 429 (Rate Limit):**
- Você excedeu o limite da API OpenAI
- Aguarde alguns minutos ou aumente seu tier

---

## 📱 **DEPLOY (Celular)**

### **Opção 1 - Túnel Temporário (ngrok):**

```bash
npx serve -s . -l 3000
ngrok http 3000
# Use a URL HTTPS gerada
```

### **Opção 2 - Deploy VPS (EasyPanel):**

```bash
# Criar repositório Git
git init
git add .
git commit -m "Análise de movimento"
git push origin main

# No EasyPanel: criar novo app do GitHub
# Branch: main
# Porta: 3000
```

---

## 📦 **DEPENDÊNCIAS**

- **MediaPipe Pose** (via CDN) - Detecção de pose
- **OpenAI GPT-4 Vision** - Análise inteligente
- **ElevenLabs** - Text-to-Speech

---

## 🔮 **PRÓXIMOS PASSOS**

- [ ] Backend proxy para ocultar chaves de API
- [ ] Salvar histórico de análises
- [ ] Comparar movimento com referência (vídeo ideal)
- [ ] Modo "treino" com análise contínua a cada X segundos
- [ ] Exportar relatório em PDF

---

**Desenvolvido para a palestra do Mestre Hikari 🥋**

