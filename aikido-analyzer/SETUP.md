# 🚀 SETUP RÁPIDO - Análise de Movimento

## ⚡ **INÍCIO RÁPIDO (5 minutos)**

### 1. **Configure as chaves de API**

```bash
# Copie o arquivo de exemplo
cp config.example.js config.js
```

Edite `config.js` e adicione suas chaves:

```javascript
OPENAI_API_KEY: 'sk-proj-...',        // OpenAI
ELEVENLABS_API_KEY: 'sua_chave',      // ElevenLabs
ELEVENLABS_VOICE_ID: 'id_da_voz',     // ID da voz do Mestre
```

### 2. **Obter as chaves:**

**OpenAI (GPT-4 Vision):**
- Acesse: https://platform.openai.com/api-keys
- Clique em "Create new secret key"
- Copie a chave (começa com `sk-proj-...`)
- ⚠️ Você precisa de créditos na conta OpenAI

**ElevenLabs (TTS):**
- Acesse: https://elevenlabs.io/app/settings/api
- Copie sua "API Key"
- Vá em: https://elevenlabs.io/app/voice-lab
- Escolha a voz do Mestre Hikari (mesma usada no n8n)
- Copie o "Voice ID" (clique no ícone de configurações da voz)

### 3. **Servir localmente**

```bash
# Com Python
python -m http.server 8080

# Ou com Node.js
npx serve -s . -l 8080

# Ou com PHP
php -S localhost:8080
```

### 4. **Abrir no navegador**

```
http://localhost:8080
```

---

## 📱 **TESTAR NO CELULAR**

### **Opção A - Mesma rede (Wi-Fi):**

1. Descubra o IP do seu PC:
   ```bash
   # Windows
   ipconfig
   
   # Mac/Linux
   ifconfig
   ```

2. Abra no celular:
   ```
   http://SEU_IP:8080
   ```

### **Opção B - Túnel público (ngrok):**

```bash
# Instalar ngrok
npm install -g ngrok

# Criar túnel
ngrok http 8080

# Use a URL HTTPS gerada no celular
```

---

## ✅ **CHECKLIST**

- [ ] `config.js` criado com chaves válidas
- [ ] Servidor rodando (porta 8080)
- [ ] Abriu no navegador (ou celular)
- [ ] Permitiu acesso à câmera
- [ ] MediaPipe detectou sua pose (skeleton verde apareceu)
- [ ] Selecionou uma técnica (Ikkyo, Shiho-nage, etc.)
- [ ] Clicou em "Analisar Meu Movimento"
- [ ] Recebeu feedback do Mestre Hikari
- [ ] Áudio foi reproduzido

---

## 🐛 **PROBLEMAS COMUNS**

### **"Configure sua chave da OpenAI"**
➜ Você não configurou o `config.js` ainda

### **"Failed to fetch" ou CORS**
➜ Use `http://localhost` ou HTTPS (não abra o arquivo HTML diretamente)

### **Câmera não aparece**
➜ Precisa HTTPS ou localhost + permissão do navegador

### **"Insufficient quota" (OpenAI)**
➜ Adicione créditos: https://platform.openai.com/account/billing

### **MediaPipe não carrega**
➜ Verifique conexão com internet (bibliotecas via CDN)

---

## 💰 **CUSTOS ESTIMADOS**

| **Serviço** | **Custo por análise** |
|-------------|-----------------------|
| **GPT-4 Vision** | ~$0.01-0.03 |
| **ElevenLabs** | ~$0.001-0.005 |
| **Total** | ~$0.02 por análise |

**Para palestra (20 análises):** ~$0.40 USD

---

## 🎯 **PRÓXIMO PASSO**

**Tudo funcionando?** Leia o `README.md` para customizações e deploy!

