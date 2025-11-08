/**
 * 🥋 MESTRE HIKARI - ANÁLISE DE MOVIMENTO
 * MediaPipe Pose + GPT-4 Vision + ElevenLabs
 */

// ========================================
// VARIÁVEIS GLOBAIS
// ========================================

let pose;
let camera;
let currentStream;
let isAnalyzing = false;
let lastPoseData = null;
let facingMode = 'user'; // 'user' (frontal) ou 'environment' (traseira)

// Elementos DOM
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const canvasCtx = canvas.getContext('2d');
const statusDiv = document.getElementById('status');
const analyzeBtn = document.getElementById('analyze-btn');
const toggleCameraBtn = document.getElementById('toggle-camera');
const techniqueSelect = document.getElementById('technique');
const feedbackArea = document.getElementById('feedback-area');
const feedbackText = document.getElementById('feedback-text');
const landmarksInfo = document.getElementById('landmarks-info');
const audioPlayer = document.getElementById('audio-player');

// ========================================
// INICIALIZAÇÃO
// ========================================

window.addEventListener('load', async () => {
    console.log('🥋 Mestre Hikari - Análise de Movimento inicializado');
    
    if (CONFIG.DEBUG) {
        console.log('🔧 Modo DEBUG ativo');
        console.log('📊 Configurações:', CONFIG);
    }
    
    await initMediaPipe();
    await initCamera();
});

// ========================================
// MEDIAPIPE SETUP
// ========================================

async function initMediaPipe() {
    statusDiv.textContent = 'Carregando MediaPipe...';
    
    pose = new Pose({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        }
    });
    
    pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: CONFIG.ANALYSIS.minPoseConfidence,
        minTrackingConfidence: CONFIG.ANALYSIS.minPoseConfidence
    });
    
    pose.onResults(onPoseResults);
    
    console.log('✅ MediaPipe Pose carregado');
}

// ========================================
// CÂMERA SETUP
// ========================================

async function initCamera() {
    try {
        statusDiv.textContent = 'Solicitando acesso à câmera...';
        
        const constraints = {
            video: {
                facingMode: facingMode,
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        };
        
        currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = currentStream;
        
        video.addEventListener('loadeddata', () => {
            // Definir dimensões fixas do canvas (evita redimensionamento)
            const containerWidth = video.parentElement.offsetWidth;
            const containerHeight = video.parentElement.offsetHeight;
            
            canvas.width = containerWidth;
            canvas.height = containerHeight;
            
            camera = new Camera(video, {
                onFrame: async () => {
                    await pose.send({ image: video });
                },
                width: 1280,
                height: 720
            });
            
            camera.start();
            statusDiv.textContent = 'Câmera ativa - Posicione-se';
            statusDiv.classList.add('detecting');
            analyzeBtn.disabled = false;
            
            console.log('✅ Câmera iniciada');
            console.log(`📐 Canvas: ${canvas.width}x${canvas.height}`);
        }, { once: true }); // Garante que só execute uma vez
        
    } catch (error) {
        console.error('❌ Erro ao acessar câmera:', error);
        statusDiv.textContent = 'Erro: Permita o acesso à câmera';
        statusDiv.style.background = 'rgba(239, 68, 68, 0.8)';
    }
}

// ========================================
// CALLBACK DO MEDIAPIPE
// ========================================

function onPoseResults(results) {
    // Otimização: só desenhar se o canvas existir e tiver dimensões
    if (!canvas.width || !canvas.height) return;
    
    // Limpar canvas (sem piscar)
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Desenhar landmarks se detectado
    if (results.poseLandmarks) {
        lastPoseData = results;
        
        // Desenhar conexões
        drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
            color: '#667eea',
            lineWidth: 4
        });
        
        // Desenhar pontos
        drawLandmarks(canvasCtx, results.poseLandmarks, {
            color: '#ffffff',
            fillColor: '#667eea',
            lineWidth: 2,
            radius: 6
        });
        
        // Debug: mostrar pontos principais (só quando não está analisando)
        if (CONFIG.DEBUG && !isAnalyzing) {
            drawDebugInfo(results.poseLandmarks);
        }
    }
    
    canvasCtx.restore();
}

// ========================================
// DESENHAR INFO DE DEBUG
// ========================================

function drawDebugInfo(landmarks) {
    const keyPoints = [
        { idx: 11, name: 'Ombro Esq.' },
        { idx: 12, name: 'Ombro Dir.' },
        { idx: 13, name: 'Cotovelo Esq.' },
        { idx: 14, name: 'Cotovelo Dir.' },
        { idx: 23, name: 'Quadril Esq.' },
        { idx: 24, name: 'Quadril Dir.' }
    ];
    
    canvasCtx.font = '12px monospace';
    canvasCtx.fillStyle = '#10b981';
    
    keyPoints.forEach(point => {
        const landmark = landmarks[point.idx];
        if (landmark) {
            const x = landmark.x * canvas.width;
            const y = landmark.y * canvas.height;
            canvasCtx.fillText(point.name, x + 10, y);
        }
    });
}

// ========================================
// CALCULAR ÂNGULOS E ALINHAMENTOS
// ========================================

function calculatePoseMetrics(landmarks) {
    /**
     * Calcula métricas importantes para análise de Aikidô:
     * - Ângulos de cotovelos, ombros, joelhos
     * - Alinhamento ombro-quadril
     * - Centro de gravidade
     * - Distâncias relativas
     */
    
    const metrics = {
        angles: {},
        alignments: {},
        center: {},
        distances: {}
    };
    
    // Landmarks importantes (índices do MediaPipe)
    const LEFT_SHOULDER = 11;
    const RIGHT_SHOULDER = 12;
    const LEFT_ELBOW = 13;
    const RIGHT_ELBOW = 14;
    const LEFT_WRIST = 15;
    const RIGHT_WRIST = 16;
    const LEFT_HIP = 23;
    const RIGHT_HIP = 24;
    const LEFT_KNEE = 25;
    const RIGHT_KNEE = 26;
    const LEFT_ANKLE = 27;
    const RIGHT_ANKLE = 28;
    
    // Calcular ângulo do cotovelo direito
    metrics.angles.rightElbow = calculateAngle(
        landmarks[RIGHT_SHOULDER],
        landmarks[RIGHT_ELBOW],
        landmarks[RIGHT_WRIST]
    );
    
    // Calcular ângulo do cotovelo esquerdo
    metrics.angles.leftElbow = calculateAngle(
        landmarks[LEFT_SHOULDER],
        landmarks[LEFT_ELBOW],
        landmarks[LEFT_WRIST]
    );
    
    // Calcular ângulo do ombro direito (em relação ao quadril)
    metrics.angles.rightShoulder = calculateAngle(
        landmarks[RIGHT_ELBOW],
        landmarks[RIGHT_SHOULDER],
        landmarks[RIGHT_HIP]
    );
    
    // Calcular ângulo do ombro esquerdo
    metrics.angles.leftShoulder = calculateAngle(
        landmarks[LEFT_ELBOW],
        landmarks[LEFT_SHOULDER],
        landmarks[LEFT_HIP]
    );
    
    // Calcular alinhamento ombro-quadril (porcentagem)
    const shoulderMid = {
        x: (landmarks[LEFT_SHOULDER].x + landmarks[RIGHT_SHOULDER].x) / 2,
        y: (landmarks[LEFT_SHOULDER].y + landmarks[RIGHT_SHOULDER].y) / 2
    };
    
    const hipMid = {
        x: (landmarks[LEFT_HIP].x + landmarks[RIGHT_HIP].x) / 2,
        y: (landmarks[LEFT_HIP].y + landmarks[RIGHT_HIP].y) / 2
    };
    
    metrics.alignments.shoulderHipAlignment = Math.abs(shoulderMid.x - hipMid.x) * 100;
    
    // Centro de gravidade (simplificado)
    metrics.center.x = hipMid.x;
    metrics.center.y = hipMid.y;
    metrics.center.deviation = Math.abs(0.5 - hipMid.x) * 100; // desvio do centro (%)
    
    // Distância entre pés (base)
    metrics.distances.footDistance = calculateDistance(
        landmarks[LEFT_ANKLE],
        landmarks[RIGHT_ANKLE]
    ) * 100;
    
    // Altura da postura (joelho ao ombro)
    metrics.distances.postureHeight = Math.abs(
        ((landmarks[LEFT_KNEE].y + landmarks[RIGHT_KNEE].y) / 2) -
        ((landmarks[LEFT_SHOULDER].y + landmarks[RIGHT_SHOULDER].y) / 2)
    ) * 100;
    
    return metrics;
}

function calculateAngle(a, b, c) {
    /**
     * Calcula ângulo entre 3 pontos (em graus)
     * b é o vértice do ângulo
     */
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - 
                    Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs(radians * 180.0 / Math.PI);
    
    if (angle > 180.0) {
        angle = 360 - angle;
    }
    
    return Math.round(angle);
}

function calculateDistance(a, b) {
    /**
     * Calcula distância euclidiana entre 2 pontos
     */
    return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
}

function interpretMetrics(metrics) {
    /**
     * Converte métricas numéricas em descrições qualitativas
     * para inclusão no prompt (GPT não menciona números na resposta)
     */
    const interpretations = [];
    
    // Cotovelos
    if (metrics.angles.rightElbow < 90) {
        interpretations.push('- Cotovelo direito muito dobrado (fechado)');
    } else if (metrics.angles.rightElbow > 160) {
        interpretations.push('- Cotovelo direito muito estendido (travado)');
    } else if (metrics.angles.rightElbow >= 120 && metrics.angles.rightElbow <= 150) {
        interpretations.push('- Cotovelo direito em boa posição');
    }
    
    if (metrics.angles.leftElbow < 90) {
        interpretations.push('- Cotovelo esquerdo muito dobrado (fechado)');
    } else if (metrics.angles.leftElbow > 160) {
        interpretations.push('- Cotovelo esquerdo muito estendido (travado)');
    } else if (metrics.angles.leftElbow >= 120 && metrics.angles.leftElbow <= 150) {
        interpretations.push('- Cotovelo esquerdo em boa posição');
    }
    
    // Alinhamento ombro-quadril
    if (metrics.alignments.shoulderHipAlignment > 5) {
        interpretations.push('- Ombros desalinhados com quadris (corpo torcido)');
    } else if (metrics.alignments.shoulderHipAlignment < 2) {
        interpretations.push('- Ombros bem alinhados com quadris');
    }
    
    // Centro
    if (metrics.center.deviation > 8) {
        const direction = metrics.center.x > 0.5 ? 'direita' : 'esquerda';
        interpretations.push(`- Centro de gravidade deslocado para a ${direction}`);
    } else if (metrics.center.deviation < 3) {
        interpretations.push('- Centro de gravidade bem posicionado');
    }
    
    // Base (distância entre pés)
    if (metrics.distances.footDistance < 15) {
        interpretations.push('- Base estreita (pés muito juntos)');
    } else if (metrics.distances.footDistance > 35) {
        interpretations.push('- Base muito ampla (pés muito afastados)');
    } else if (metrics.distances.footDistance >= 20 && metrics.distances.footDistance <= 30) {
        interpretations.push('- Base adequada para estabilidade');
    }
    
    // Altura da postura
    if (metrics.distances.postureHeight > 45) {
        interpretations.push('- Postura alta (centro pode estar elevado demais)');
    } else if (metrics.distances.postureHeight < 35) {
        interpretations.push('- Postura muito baixa (pode comprometer mobilidade)');
    } else {
        interpretations.push('- Altura da postura adequada');
    }
    
    return interpretations;
}

function assessTechniqueQuality(interpretations) {
    /**
     * Avalia a qualidade geral com base nas interpretações
     * Retorna: "Boa execução", "Precisa ajustes", "Execução adequada com pequenos ajustes"
     */
    const positiveKeywords = ['bem', 'boa', 'adequada', 'correto'];
    const negativeKeywords = ['muito', 'demais', 'deslocado', 'estreita', 'alta', 'baixa', 'travado', 'dobrado', 'torcido'];
    
    let goodCount = 0;
    let badCount = 0;
    
    interpretations.forEach(interp => {
        const lower = interp.toLowerCase();
        if (positiveKeywords.some(kw => lower.includes(kw))) {
            goodCount++;
        }
        if (negativeKeywords.some(kw => lower.includes(kw))) {
            badCount++;
        }
    });
    
    if (badCount === 0 && goodCount > 0) {
        return "✅ Técnica bem executada - elogie o praticante!";
    } else if (badCount > goodCount) {
        return "⚠️ Técnica precisa de ajustes - corrija com compaixão.";
    } else {
        return "🟡 Técnica parcialmente correta - elogie o que está bom e corrija o necessário.";
    }
}

// ========================================
// CAPTURAR FRAME COMO BASE64
// ========================================

function captureFrame() {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    const tempCtx = tempCanvas.getContext('2d');
    
    tempCtx.drawImage(video, 0, 0);
    
    return tempCanvas.toDataURL('image/jpeg', CONFIG.ANALYSIS.imageQuality).split(',')[1];
}

// ========================================
// ANALISAR COM GPT-4 VISION
// ========================================

async function analyzeMovement() {
    if (!lastPoseData || !lastPoseData.poseLandmarks) {
        alert('⚠️ Nenhuma pose detectada. Posicione-se na frente da câmera.');
        return;
    }
    
    if (isAnalyzing) {
        return;
    }
    
    isAnalyzing = true;
    analyzeBtn.disabled = true;
    feedbackArea.classList.add('hidden');
    
    try {
        // COUNTDOWN: Dar tempo para o aluno se posicionar
        await performCountdown();
        
        const technique = techniqueSelect.value;
        let images = [];
        let metricsSequence = [];
        
        if (CONFIG.ANALYSIS.captureSequence) {
            // MODO SEQUÊNCIA: Captura múltiplos frames durante o movimento
            const capturedData = await captureMovementSequence();
            images = capturedData.images;
            metricsSequence = capturedData.metrics;
            
            if (CONFIG.DEBUG) {
                console.log(`📸 Capturados ${images.length} frames do movimento`);
                console.log('📊 Sequência de métricas:', metricsSequence);
            }
        } else {
            // MODO FOTO ÚNICA (antigo)
            const imageBase64 = CONFIG.ANALYSIS.includeImage ? captureFrame() : null;
            if (imageBase64) images.push(imageBase64);
            metricsSequence.push(calculatePoseMetrics(lastPoseData.poseLandmarks));
        }
        
        // Analisando...
        statusDiv.textContent = 'Analisando movimento...';
        statusDiv.classList.remove('detecting');
        statusDiv.classList.add('analyzing');
        
        // Usar métricas médias ou da última captura
        const finalMetrics = metricsSequence[metricsSequence.length - 1];
        
        // Criar prompt
        const prompt = createAnalysisPrompt(technique, finalMetrics, images.length);
        
        if (CONFIG.DEBUG) {
            console.log('📝 Prompt:', prompt);
        }
        
        // Chamar GPT-4 Vision
        const analysis = await callGPT4Vision(prompt, images);
        
        // Exibir feedback
        displayFeedback(analysis, finalMetrics);
        
        // Gerar áudio (ElevenLabs)
        await generateAndPlayAudio(analysis);
        
    } catch (error) {
        console.error('❌ Erro na análise:', error);
        alert('Erro ao analisar movimento: ' + error.message);
        statusDiv.textContent = 'Erro na análise';
        statusDiv.style.background = 'rgba(239, 68, 68, 0.8)';
    } finally {
        isAnalyzing = false;
        analyzeBtn.disabled = false;
        statusDiv.textContent = 'Análise concluída';
        statusDiv.classList.remove('analyzing');
        statusDiv.classList.add('detecting');
    }
}

async function performCountdown() {
    /**
     * Countdown de 3 segundos para dar tempo do aluno se posicionar
     */
    const countdownDuration = 3;
    
    for (let i = countdownDuration; i > 0; i--) {
        statusDiv.textContent = `Prepare-se... ${i}`;
        statusDiv.classList.remove('detecting', 'analyzing');
        statusDiv.classList.add('analyzing');
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Sinalizar início da captura
    if (CONFIG.ANALYSIS.captureSequence) {
        statusDiv.textContent = `🎥 Executando movimento... (${CONFIG.ANALYSIS.sequenceDuration}s)`;
    } else {
        statusDiv.textContent = '📸 Capturando!';
    }
    
    canvas.style.border = '5px solid #10b981';
    await new Promise(resolve => setTimeout(resolve, 300));
    canvas.style.border = 'none';
}

async function captureMovementSequence() {
    /**
     * Captura uma sequência de frames durante o movimento
     * Retorna: { images: [...], metrics: [...] }
     */
    const duration = CONFIG.ANALYSIS.sequenceDuration * 1000; // converter para ms
    const fps = CONFIG.ANALYSIS.framesPerSecond;
    const interval = 1000 / fps; // intervalo entre capturas em ms
    const totalFrames = Math.floor(duration / interval);
    
    const images = [];
    const metrics = [];
    
    let frameCount = 0;
    const startTime = Date.now();
    
    return new Promise((resolve) => {
        const captureInterval = setInterval(() => {
            frameCount++;
            const elapsed = Date.now() - startTime;
            const remaining = Math.ceil((duration - elapsed) / 1000);
            
            // Atualizar status com tempo restante
            if (remaining > 0) {
                statusDiv.textContent = `🎥 Gravando movimento... ${remaining}s`;
            }
            
            // Efeito visual de gravação (pisca suave)
            if (frameCount % 2 === 0) {
                canvas.style.border = '3px solid #ef4444';
                setTimeout(() => canvas.style.border = 'none', 100);
            }
            
            // Capturar frame e métricas
            if (lastPoseData && lastPoseData.poseLandmarks) {
                try {
                    const frame = captureFrame();
                    const frameMetrics = calculatePoseMetrics(lastPoseData.poseLandmarks);
                    images.push(frame);
                    metrics.push(frameMetrics);
                } catch (err) {
                    console.warn('Erro ao capturar frame:', err);
                }
            }
            
            // Verificar se terminou
            if (elapsed >= duration || frameCount >= totalFrames) {
                clearInterval(captureInterval);
                canvas.style.border = 'none';
                statusDiv.textContent = '✅ Gravação concluída!';
                
                if (CONFIG.DEBUG) {
                    console.log(`✅ Capturados ${images.length} frames em ${(elapsed/1000).toFixed(1)}s`);
                }
                
                resolve({ images, metrics });
            }
        }, interval);
    });
}

// ========================================
// CRIAR PROMPT PARA GPT-4
// ========================================

function createAnalysisPrompt(technique, metrics, frameCount = 1) {
    const techniques = {
        'ikkyo': {
            name: 'Ikkyo (Primeiro Princípio)',
            focus: 'Controle do cotovelo junto ao centro, alinhamento do corpo, peso baixo e condução com o corpo inteiro.'
        },
        'shiho-nage': {
            name: 'Shiho-nage (Projeção nas 4 Direções)',
            focus: 'Elevação do braço acima da cabeça, trazer o uke para o centro, giro do corpo em bloco, movimento próximo como corte de espada.'
        },
        'irimi-nage': {
            name: 'Irimi-nage (Entrar e Projetar)',
            focus: 'Entrada no ponto cego (irimi verdadeiro), passar atrás da linha, controle da cabeça/linha, projeção descendo o peso.'
        },
        'kokyu-ho': {
            name: 'Kokyu-ho (Exercício de Respiração)',
            focus: 'Estabilidade no seiza, uso do centro e respiração, não empurrar com ombros, acompanhar o parceiro até o fim.'
        }
    };
    
    const selectedTechnique = techniques[technique];
    
    // Interpretações qualitativas dos dados (para o prompt)
    const interpretations = interpretMetrics(metrics);
    
    // Avaliar qualidade geral da técnica
    const qualityAssessment = assessTechniqueQuality(interpretations);
    
    const sequenceInfo = frameCount > 1 
        ? `**${frameCount} imagens em sequência do movimento foram anexadas. Analise o FLUXO COMPLETO da técnica, do início ao fim.**`
        : CONFIG.ANALYSIS.includeImage ? '**Uma imagem do movimento está anexada para análise visual complementar.**' : '';
    
    return `Você é o Mestre Hikari, um sensei experiente de Aikidô. Analise o movimento do praticante que está executando a técnica **${selectedTechnique.name}**.

**Foco da Técnica:**
${selectedTechnique.focus}

**Observações Biomecânicas (última captura):**
${interpretations.join('\n')}

**Avaliação Geral:**
${qualityAssessment}

${sequenceInfo}

**Instruções Críticas (COMO UM SENSEI VERDADEIRO):**
${frameCount > 1 ? '0. Você recebeu MÚLTIPLAS IMAGENS em sequência. Analise o MOVIMENTO COMPLETO, não apenas uma pose. Observe a transição, o fluxo, a continuidade da técnica do início ao fim.\n' : ''}
1. Se a técnica está **CORRETA/BOA**: ELOGIE primeiro! Reconheça o que está bem feito. Use frases como:
   - "Excelente! Seu centro está firme e estável."
   - "Muito bem! Os ombros e quadris estão alinhados perfeitamente."
   - "Ótimo trabalho! A base está sólida."
   - "Continue assim! O movimento está fluindo com harmonia."
   
2. Se a técnica está **INCORRETA/PRECISA MELHORAR**: Corrija com compaixão, mas seja direto:
   - "Seu centro precisa baixar um pouco. Sinta as raízes na terra."
   - "Os cotovelos estão travados. Mantenha uma leve flexão."
   
3. Se está **PARCIALMENTE CORRETA**: Elogie o que está bom E corrija o que precisa:
   - "Ótimo alinhamento de ombros! Agora, abaixe o centro para maior estabilidade."

4. NUNCA mencione porcentagens, números ou graus
5. NÃO comente sobre identidade, aparência ou roupas — foque APENAS na técnica
6. Use descrições qualitativas: "cotovelo dobrado", "centro alto", "base estreita"
7. Dê feedback PRÁTICO e DIRETO: "Abaixe", "Alinhe", "Amplie", "Flexione"
8. Sua resposta deve ter **no máximo 80 palavras** (seja conciso e objetivo como um sensei)
9. METÁFORAS: Use NO MÁXIMO UMA metáfora por resposta (quando apropriado). Não encha o texto de metáforas. Exemplos:
   - ✅ BOM: "Abaixe o centro, como raízes na terra. Amplie a base."
   - ❌ RUIM: "Como bambu... como água... como raízes... como vento..."
   - ✅ BOM: "Mantenha leve flexão nos cotovelos. Alinhe os ombros."
   - Seja DIRETO e PRÁTICO, não poético demais

**Formato da resposta:**
Texto direto e natural, como um sensei falando no dōjō. Sem JSON, sem formatação, sem números.

**Exemplos:**

*Se BOM:*
"Excelente! Seu centro está firme e bem conectado ao solo. Os ombros e quadris formam uma linha harmoniosa. Continue assim, mantendo essa estabilidade."

*Se PRECISA CORREÇÃO:*
"Seu centro está elevado. Abaixe-o, sentindo as raízes na terra. Os cotovelos estão travados — mantenha uma leve flexão. Amplie a base para maior estabilidade."

*Se PARCIALMENTE BOM:*
"Bom alinhamento de ombros! Agora, baixe o centro para maior estabilidade. Os cotovelos precisam de uma leve flexão. Amplie a base."

**LEMBRE-SE: Seja DIRETO e OBJETIVO. Uma metáfora no máximo. O aluno precisa de clareza, não poesia.**`;
}

// ========================================
// CHAMAR GPT-4 VISION API
// ========================================

async function callGPT4Vision(prompt, images) {
    /**
     * Chama GPT-4 Vision com uma ou múltiplas imagens
     * @param {string} prompt - O prompt de análise
     * @param {string|string[]} images - Uma imagem base64 ou array de imagens
     */
    const imageArray = Array.isArray(images) ? images : [images];
    
    const messages = [
        {
            role: 'user',
            content: []
        }
    ];
    
    // Adicionar todas as imagens (se disponíveis)
    imageArray.forEach((imageBase64, index) => {
        if (imageBase64) {
            messages[0].content.push({
                type: 'image_url',
                image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`,
                    detail: 'low' // 'low' = mais barato e rápido, 'high' = mais detalhado
                }
            });
        }
    });
    
    // Adicionar texto do prompt
    messages[0].content.push({
        type: 'text',
        text: prompt
    });
    
    if (CONFIG.DEBUG && imageArray.length > 1) {
        console.log(`📤 Enviando ${imageArray.length} imagens para análise`);
    }
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${CONFIG.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: CONFIG.OPENAI_MODEL,
            messages: messages,
            max_tokens: 500,
            temperature: 0.7
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API Error: ${error.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    const analysis = data.choices[0].message.content;
    
    if (CONFIG.DEBUG) {
        console.log('🤖 Resposta GPT-4:', analysis);
    }
    
    return analysis;
}

// ========================================
// EXIBIR FEEDBACK NA TELA
// ========================================

function displayFeedback(analysis, metrics) {
    feedbackText.textContent = analysis;
    
    landmarksInfo.innerHTML = `
        <h4>📊 Dados Técnicos:</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
                <strong>Cotovelo Dir.:</strong> ${metrics.angles.rightElbow}°<br>
                <strong>Cotovelo Esq.:</strong> ${metrics.angles.leftElbow}°<br>
                <strong>Ombro Dir.:</strong> ${metrics.angles.rightShoulder}°<br>
                <strong>Ombro Esq.:</strong> ${metrics.angles.leftShoulder}°
            </div>
            <div>
                <strong>Alinhamento:</strong> ${metrics.alignments.shoulderHipAlignment.toFixed(1)}%<br>
                <strong>Centro:</strong> ${metrics.center.deviation.toFixed(1)}% desvio<br>
                <strong>Base:</strong> ${metrics.distances.footDistance.toFixed(1)}%<br>
                <strong>Postura:</strong> ${metrics.distances.postureHeight.toFixed(1)}%
            </div>
        </div>
    `;
    
    feedbackArea.classList.remove('hidden');
}

// ========================================
// GERAR ÁUDIO COM ELEVENLABS
// ========================================

async function generateAndPlayAudio(text) {
    statusDiv.textContent = 'Gerando áudio...';
    statusDiv.classList.remove('analyzing');
    statusDiv.classList.add('speaking');
    
    try {
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${CONFIG.ELEVENLABS_VOICE_ID}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'xi-api-key': CONFIG.ELEVENLABS_API_KEY
            },
            body: JSON.stringify({
                text: text,
                model_id: 'eleven_multilingual_v2',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75
                }
            })
        });
        
        if (!response.ok) {
            throw new Error(`ElevenLabs API Error: ${response.statusText}`);
        }
        
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        audioPlayer.src = audioUrl;
        await audioPlayer.play();
        
        audioPlayer.onended = () => {
            statusDiv.textContent = 'Pronto para nova análise';
            statusDiv.classList.remove('speaking');
            statusDiv.classList.add('detecting');
        };
        
        if (CONFIG.DEBUG) {
            console.log('🔊 Áudio gerado e reproduzindo');
        }
        
    } catch (error) {
        console.error('❌ Erro ao gerar áudio:', error);
        statusDiv.textContent = 'Erro ao gerar áudio (feedback visível acima)';
        statusDiv.classList.remove('speaking');
        statusDiv.classList.add('detecting');
    }
}

// ========================================
// EVENT LISTENERS
// ========================================

analyzeBtn.addEventListener('click', analyzeMovement);

toggleCameraBtn.addEventListener('click', async () => {
    // Desabilitar botão durante troca
    toggleCameraBtn.disabled = true;
    statusDiv.textContent = 'Trocando câmera...';
    
    // Trocar entre câmera frontal e traseira
    facingMode = facingMode === 'user' ? 'environment' : 'user';
    
    // Parar câmera atual
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
    }
    
    // Parar MediaPipe temporariamente
    if (camera) {
        camera.stop();
    }
    
    // Aguardar um pouco antes de reiniciar (evita piscar)
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Reiniciar com nova câmera
    await initCamera();
    
    toggleCameraBtn.disabled = false;
    
    console.log(`📷 Câmera trocada para: ${facingMode === 'user' ? 'frontal' : 'traseira'}`);
});

