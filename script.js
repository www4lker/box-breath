// script.js (Completo e Atualizado - v8.1 FINAL: Inclui Box, 478, Diaphragmatic Corrigida, Alternate Nostril, Verificações)
// Espera o HTML carregar completamente antes de executar o script
document.addEventListener('DOMContentLoaded', () => {

    // --- Constantes ---
    const THEME_STORAGE_KEY = 'themePreference';
    const PHASE = { INHALE: 0, HOLD_IN: 1, EXHALE: 2, HOLD_OUT: 3 }; // Box Phases
    const TOTAL_PHASES_BOX = 4;
    const UI_STATE = { IDLE: 'idle', PREPARING: 'preparing', BREATHING: 'breathing', FINISHED: 'finished' };
    // Categorias para paleta geral CSS
    const techniqueCategories = {
        box: 'focus', alternate: 'focus', // Alternate usa paleta 'focus' geral
        bhastrika: 'energy', kapal: 'energy',
        diaphragmatic: 'relaxation', bhramari: 'relaxation', '478': 'relaxation'
    };
    // Paletas específicas para cores de fase na animação (JS)
    const breathingPalette478 = { // Para 4-7-8
      inhale: '#174073', hold: '#989FB1', exhale: '#CDA561'
    };
    const breathingPaletteDiaphragmatic = { // Para Diaphragmatic (baseado na sugestão)
        inhale: '#174073', exhale: '#CDA561'
    };
    const breathingPaletteAlternate = { // Para Alternate Nostril
      leftNostril: '#174073', rightNostril: '#CDA561',
      inactive: '#CAC2B3', hold: '#989FB1'
    };
    
    // --- Elementos DOM ---
    const htmlElement = document.documentElement; const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn'); const toggleAdvancedBtn = document.getElementById('toggle-advanced');
    const breathingBox = document.getElementById('breathing-box'); const progressIndicator = document.getElementById('progress-indicator');
    const instruction = document.getElementById('instruction'); const timerDisplay = document.getElementById('timer');
    const countdownDisplay = document.getElementById('countdown'); const countdownNumber = document.getElementById('countdown-number');
    const progressBar = document.getElementById('progress-bar'); const durationSelect = document.getElementById('duration-select');
    const techniqueSelect = document.getElementById('technique-select'); const advancedControls = document.getElementById('advanced-controls');
    const phaseDurationInput = document.getElementById('phase-duration'); const phaseDurationValue = document.getElementById('phase-duration-value');
    const themeToggleBtn = document.getElementById('theme-toggle'); const boxContainer = document.getElementById('box-container');
    const phaseDurationControls = document.querySelector('.control-group[data-technique="box"]');
    const phaseCountdownDisplay = document.getElementById('phase-countdown');
    // Referências globais para elementos Alternate Nostril
    let leftNostrilElement = null;
    let rightNostrilElement = null;
    
    // --- Variáveis de Estado ---
    let isBreathing = false; let currentPhase = 0; let totalDurationSeconds = 0; let elapsedTimeSeconds = 0;
    let animationFrameId = null; let phaseTimeoutId = null; let countdownIntervalId = null;
    let currentUIState = UI_STATE.IDLE; let selectedTechnique = 'box'; let currentCategory = 'focus';
    let currentPhaseDuration = 0; let animationStartTime = 0; let lastAnimationFrameTimestamp = 0;
    let phaseStartTime = 0; let audioCtx = null; const sounds = { inhale: null, exhale: null, hold: null, vertex: null };
    let boxRect = null; let containerRect = null;
    
    // --- Funções Auxiliares ---
    /** Converte número para numeral romano (simplificado para 1-10) */
    function toRoman(num) {
        const romanMap = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X' };
        return romanMap[num] || (num > 0 ? num.toString() : 'I'); // Mostra 'I' para 0 ou menos
    }
    
    // --- Funções de Som (Web Audio API) ---
    /** Inicializa o AudioContext e cria os nós de áudio reutilizáveis */
    function initAudio() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) { console.warn("Web Audio API não suportada."); return; }
            if (!audioCtx) {
                audioCtx = new AudioContext();
                const createSoundNode = (type, baseFreq, targetFreq = null) => { const oscillator = audioCtx.createOscillator(); const gainNode = audioCtx.createGain(); oscillator.type = type; oscillator.frequency.value = baseFreq; gainNode.gain.value = 0; oscillator.connect(gainNode); gainNode.connect(audioCtx.destination); oscillator.start(); return { oscillator, gainNode, baseFreq, targetFreq }; };
                sounds.inhale = createSoundNode('sine', 220, 440); sounds.exhale = createSoundNode('sine', 440, 220); sounds.hold = createSoundNode('sine', 330); sounds.vertex = createSoundNode('square', 660);
                console.log("AudioContext inicializado.");
            }
        } catch (e) { console.error("Erro ao inicializar Web Audio API:", e); audioCtx = null; }
     }
    /** Toca um som específico com rampas de frequência e ganho */
    function playSound(soundData, durationSeconds) {
        if (!audioCtx || !soundData || !soundData.gainNode) return;
        const { oscillator, gainNode, baseFreq, targetFreq } = soundData; const now = audioCtx.currentTime;
        oscillator.frequency.cancelScheduledValues(now); oscillator.frequency.setValueAtTime(baseFreq, now); if (targetFreq !== null && durationSeconds > 0.05) { oscillator.frequency.linearRampToValueAtTime(targetFreq, now + durationSeconds); }
        gainNode.gain.cancelScheduledValues(now); gainNode.gain.setValueAtTime(0, now); gainNode.gain.linearRampToValueAtTime(0.15, now + 0.05); if (durationSeconds > 0.15) { gainNode.gain.setValueAtTime(0.15, now + durationSeconds - 0.1); gainNode.gain.linearRampToValueAtTime(0, now + durationSeconds); } else { gainNode.gain.linearRampToValueAtTime(0, now + durationSeconds); }
    }
    /** Toca um som curto e pontual (beep de transição) */
    function playVertexSound() {
        if (!audioCtx || !sounds.vertex || !sounds.vertex.gainNode) return;
        const { oscillator, gainNode, baseFreq } = sounds.vertex; const now = audioCtx.currentTime; oscillator.frequency.setValueAtTime(baseFreq, now);
        gainNode.gain.cancelScheduledValues(now); gainNode.gain.setValueAtTime(0, now); gainNode.gain.linearRampToValueAtTime(0.25, now + 0.01); gainNode.gain.linearRampToValueAtTime(0, now + 0.15);
     }
    /** Para todos os sons suavemente (fade out) */
    function stopAllSounds() {
        if (!audioCtx) return; const now = audioCtx.currentTime;
        Object.values(sounds).forEach(soundData => { if (soundData && soundData.gainNode) { soundData.gainNode.gain.cancelScheduledValues(now); soundData.gainNode.gain.linearRampToValueAtTime(0, now + 0.05); } });
     }
    
    // --- Funções de Tema e Paleta ---
    /** Obtém o tema inicial (localStorage ou preferência do sistema) */
    const getInitialTheme = () => {
        const storedTheme = localStorage.getItem(THEME_STORAGE_KEY); if (storedTheme) return storedTheme; const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches; return prefersDark ? 'dark' : 'light';
     };
    /** Aplica o tema (light/dark) ao HTML e salva a preferência */
    const applyTheme = (theme) => {
        htmlElement.dataset.theme = theme; localStorage.setItem(THEME_STORAGE_KEY, theme);
     };
    /** Aplica a categoria (paleta de cores) ao HTML */
    const applyCategoryPalette = (category) => {
        if (!category) category = 'focus'; htmlElement.dataset.category = category; currentCategory = category; console.log(`Paleta de categoria aplicada: ${category}`);
        setTimeout(updateBoxDimensions, 50); // Delay para cálculo de dimensões
    };
    
    // --- Funções de Controle e UI (Interface do Usuário) ---
    /** Retorna a duração da fase em segundos (lê o slider dos controles avançados) */
    function getPhaseDurationSeconds() {
        return phaseDurationInput ? parseInt(phaseDurationInput.value, 10) : 4; // Retorna 4 como padrão
    }
    /** Mostra/Esconde os controles avançados corretos para a técnica */
    function toggleAdvancedControlsVisibility(technique) {
        if (phaseDurationControls) {
            phaseDurationControls.style.display = (technique === 'box') ? 'block' : 'none';
        }
    }
    /** Atualiza a interface (botões, textos, visibilidade do contador de fase) */
    function setUIState(newState) {
        currentUIState = newState;
        console.log("UI State:", newState);
    
        if(startBtn) startBtn.classList.add('hidden');
        if(stopBtn) stopBtn.classList.add('hidden');
        if(countdownDisplay) countdownDisplay.classList.add('hidden');
        if (phaseCountdownDisplay) phaseCountdownDisplay.style.display = 'none'; // Esconde contador fase por padrão
    
        switch (newState) {
            case UI_STATE.IDLE:
                if(startBtn) startBtn.classList.remove('hidden');
                if(instruction) instruction.textContent = "Pronto para começar?";
                if (durationSelect && timerDisplay) timerDisplay.textContent = formatTime(parseInt(durationSelect.value, 10));
                if (progressBar) { progressBar.style.width = '0%'; progressBar.textContent = '0%'; }
                toggleAdvancedControlsVisibility(selectedTechnique);
                break;
            case UI_STATE.PREPARING:
                if(countdownDisplay) countdownDisplay.classList.remove('hidden');
                if(instruction) instruction.textContent = "Prepare-se...";
                if (advancedControls) advancedControls.style.display = 'none';
                if (toggleAdvancedBtn) toggleAdvancedBtn.textContent = 'Mostrar Controles Avançados';
                break;
            case UI_STATE.BREATHING:
                if(stopBtn) stopBtn.classList.remove('hidden');
                if (phaseCountdownDisplay) phaseCountdownDisplay.style.display = 'block'; // Mostra contador fase
                if (advancedControls) advancedControls.style.display = 'none';
                if (toggleAdvancedBtn) toggleAdvancedBtn.textContent = 'Mostrar Controles Avançados';
                break;
            case UI_STATE.FINISHED:
                if(startBtn) startBtn.classList.remove('hidden');
                if(instruction) instruction.textContent = "Exercício finalizado!";
                toggleAdvancedControlsVisibility(selectedTechnique);
                break;
        }
    }
    /** Formata segundos totais no formato MM:SS */
    function formatTime(totalSeconds) {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = Math.floor(totalSeconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
     }
    /** Reseta a posição e visibilidade do indicador (ponto do Box) */
    function resetIndicatorPosition() {
        if (progressIndicator) {
            progressIndicator.style.left = `50%`;
            progressIndicator.style.top = `0%`;
            // Visibilidade (display) é controlada por configureInitialStateForTechnique
        }
    }
    /** Calcula e atualiza as dimensões da caixa (chamada na inicialização e em mudanças de layout) */
    function updateBoxDimensions() {
         requestAnimationFrame(() => {
            if (!breathingBox || !boxContainer) { console.error("Elementos da caixa de animação não encontrados."); boxRect = null; return; }
            boxRect = breathingBox.getBoundingClientRect();
            containerRect = boxContainer.getBoundingClientRect();
            if (!boxRect || !containerRect || containerRect.width === 0 || containerRect.height === 0) { console.warn("Dimensões da caixa inválidas ou zero."); boxRect = null; }
            else {
                 boxRect.relativeLeft = (boxRect.left - containerRect.left) / containerRect.width * 100; boxRect.relativeRight = (boxRect.right - containerRect.left) / containerRect.width * 100;
                 boxRect.relativeTop = (boxRect.top - containerRect.top) / containerRect.height * 100; boxRect.relativeBottom = (boxRect.bottom - containerRect.top) / containerRect.height * 100;
                 boxRect.relativeWidth = boxRect.relativeRight - boxRect.relativeLeft; boxRect.relativeHeight = boxRect.relativeBottom - boxRect.relativeTop;
            }
         });
     }
    
    // --- Funções de Criação/Remoção de Elementos ---
    /** Cria os elementos visuais para a animação Alternate Nostril */
    function createAlternateNostrilElements() {
        if (!boxContainer) return;
        removeAlternateNostrilElements(); // Garante limpeza prévia
    
        leftNostrilElement = document.createElement('div');
        leftNostrilElement.id = 'leftNostril'; leftNostrilElement.className = 'nostril';
        leftNostrilElement.setAttribute('style', `
            position: absolute; left: 25%; top: 50%;
            transform: translate(-50%, -50%) scale(0.6); width: 60px; height: 120px;
            border-radius: 50% 0 0 50%; border: 3px solid ${breathingPaletteAlternate.inactive};
            background-color: ${breathingPaletteAlternate.inactive}33;
            transition: transform 0.5s ease-in-out, background-color 0.5s ease, border-color 0.5s ease, opacity 0.5s ease;
            opacity: 1;`);
        boxContainer.appendChild(leftNostrilElement);
    
        rightNostrilElement = document.createElement('div');
        rightNostrilElement.id = 'rightNostril'; rightNostrilElement.className = 'nostril';
        rightNostrilElement.setAttribute('style', `
            position: absolute; left: 75%; top: 50%;
            transform: translate(-50%, -50%) scale(0.6); width: 60px; height: 120px;
            border-radius: 0 50% 50% 0; border: 3px solid ${breathingPaletteAlternate.inactive};
            background-color: ${breathingPaletteAlternate.inactive}33;
            transition: transform 0.5s ease-in-out, background-color 0.5s ease, border-color 0.5s ease, opacity 0.5s ease;
            opacity: 1;`);
        boxContainer.appendChild(rightNostrilElement);
    
        if (breathingBox) breathingBox.style.display = 'none';
        console.log("Elementos Alternate Nostril criados."); // Log
    }
    /** Remove os elementos visuais da animação Alternate Nostril */
    function removeAlternateNostrilElements() {
        let removed = false;
        if (leftNostrilElement && leftNostrilElement.parentNode) {
            leftNostrilElement.parentNode.removeChild(leftNostrilElement);
            removed = true;
        }
        if (rightNostrilElement && rightNostrilElement.parentNode) {
            rightNostrilElement.parentNode.removeChild(rightNostrilElement);
            removed = true;
        }
        leftNostrilElement = null; rightNostrilElement = null;
        if (breathingBox) breathingBox.style.display = 'block'; // Mostra a caixa padrão novamente
        if (removed) console.log("Elementos Alternate Nostril removidos."); // Log
    }
    
    // --- Funções Principais do Exercício ---
    /** Ajusta estado inicial e visual baseado na técnica selecionada */
    function configureInitialStateForTechnique(technique) {
        // Verifica elementos essenciais para configurar o visual
        if (!breathingBox || !progressIndicator || !phaseCountdownDisplay || !boxContainer) {
             console.error("Erro ao configurar técnica: Elementos visuais principais não encontrados.");
             return;
        }
    
        console.log(`Configurando estado inicial para: ${technique}`);
        // Reset Geral: Remove customizações e mostra elementos padrão
        removeAlternateNostrilElements(); // Remove narinas se existirem de antes
        breathingBox.style.display = 'block'; // Garante visibilidade
        progressIndicator.style.display = 'none';
        phaseCountdownDisplay.style.display = 'none';
        breathingBox.style.transform = 'translate(-50%, -50%) scale(1)';
        breathingBox.style.borderRadius = '10px'; // Caixa padrão
        breathingBox.style.borderColor = 'var(--destaque-1)';
        breathingBox.style.backgroundColor = 'transparent';
        // Transição Padrão (pode ser sobrescrita)
        breathingBox.style.transition = 'border-color 0.5s ease, transform 0.5s ease-in-out, border-radius 0.5s ease, background-color 0.5s ease';
    
        // Configurações Específicas
        switch (technique) {
            case 'alternate':
                currentPhase = 0; // Ciclo de 8 fases
                createAlternateNostrilElements(); // Cria os elementos visuais específicos
                break;
            case '478':
                currentPhase = 0;
                breathingBox.style.borderRadius = '50%'; // Círculo
                breathingBox.style.transform = 'translate(-50%, -50%) scale(0.5)'; // Pequeno
                breathingBox.style.borderColor = breathingPalette478.inhale; // Cor inicial
                breathingBox.style.backgroundColor = `${breathingPalette478.inhale}33`;
                // Transição específica 4-7-8
                breathingBox.style.transition = 'transform 0.3s ease, background-color 1s ease, border-color 1s ease';
                break;
             case 'diaphragmatic':
                 currentPhase = 0;
                 breathingBox.style.borderRadius = '20%'; // 'Achatado'
                 breathingBox.style.transform = 'translate(-50%, -50%) scale(0.5)'; // Pequeno
                 breathingBox.style.borderColor = breathingPaletteDiaphragmatic.exhale; // Cor inicial (fim exp.)
                 breathingBox.style.backgroundColor = `${breathingPaletteDiaphragmatic.exhale}33`;
                 // Transição específica Diaphragmatic
                 breathingBox.style.transition = 'transform 1.5s ease-in-out, background-color 1.5s ease, border-color 1.5s ease, border-radius 1.5s ease';
                 break;
            case 'box':
            default:
                currentPhase = PHASE.INHALE;
                progressIndicator.style.display = 'block'; // Mostra ponto
                resetIndicatorPosition(); // Posição inicial do ponto
                break;
        }
        toggleAdvancedControlsVisibility(technique); // Ajusta controles avançados
    }
    
    /** Inicia a contagem regressiva e, em seguida, o exercício */
    function startExercise() {
        console.log("startExercise chamada");
        if (isBreathing) { console.log("Exercício já em andamento."); return; }
        if (!techniqueSelect || !durationSelect) { console.error("Erro: Elementos de seleção não encontrados."); alert("Erro ao iniciar."); return; }
    
        selectedTechnique = techniqueSelect.value;
        currentCategory = techniqueCategories[selectedTechnique] || 'focus';
        applyCategoryPalette(currentCategory);
        console.log(`Iniciando exercício: ${selectedTechnique}, Categoria: ${currentCategory}`);
        if (!audioCtx) { initAudio(); }
    
        totalDurationSeconds = parseInt(durationSelect.value, 10);
        elapsedTimeSeconds = 0;
        if (isNaN(totalDurationSeconds) || totalDurationSeconds <= 0) { console.error("Erro: Duração inválida."); alert("Selecione duração válida."); return; }
    
        configureInitialStateForTechnique(selectedTechnique); // Configura visual ANTES da contagem
        setUIState(UI_STATE.PREPARING);
    
        let countdownValue = 3;
        if (countdownNumber) countdownNumber.textContent = countdownValue;
        else { console.error("Elemento countdownNumber não encontrado!"); }
    
        if (countdownIntervalId) clearInterval(countdownIntervalId);
        countdownIntervalId = setInterval(() => {
            countdownValue--;
            if (countdownNumber) countdownNumber.textContent = countdownValue;
            if (countdownValue <= 0) {
                clearInterval(countdownIntervalId); countdownIntervalId = null;
                console.log("Contagem finalizada. Iniciando animação...");
                setTimeout(() => {
                     if (selectedTechnique === 'box' && !boxRect) {
                         console.warn("Recalculando dimensões Box..."); updateBoxDimensions();
                         setTimeout(() => { if (!boxRect) { console.error("Falha Box: dimensões inválidas."); stopExercise(true); } else { startBreathingAnimation(); } }, 100);
                     } else { startBreathingAnimation(); }
                }, 60);
            }
        }, 1000);
    } // Fim startExercise
    
    /** Inicia a animação e o ciclo de respiração principal */
    function startBreathingAnimation() {
        console.log("startBreathingAnimation chamada");
        isBreathing = true;
        setUIState(UI_STATE.BREATHING);
        animationStartTime = performance.now();
        lastAnimationFrameTimestamp = animationStartTime;
        phaseStartTime = animationStartTime;
        updateBreathingPhase(); // Configura a primeira fase
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(animationLoop);
    }
    
    /** Atualiza a fase (texto, som, COR específica) E GUARDA A DURAÇÃO */
    function updateBreathingPhase() {
        if (!isBreathing) return;
        // Verifica se temos elementos visuais para a técnica atual
        if (selectedTechnique !== 'alternate' && !breathingBox) { console.warn("Elemento breathingBox não encontrado para técnica atual."); return; }
        if (selectedTechnique === 'alternate' && (!leftNostrilElement || !rightNostrilElement)) { console.warn("Elementos das narinas não encontrados para Alternate."); return; }
    
        if (phaseTimeoutId) clearTimeout(phaseTimeoutId);
        playVertexSound();
        currentPhaseDuration = 0;
    
        let instructionText = ""; let soundToPlay = null; let nextPhase = 0;
    
        // Reset visual antes de aplicar estilo da fase
        if (breathingBox) { breathingBox.style.backgroundColor = 'transparent'; breathingBox.style.borderColor = 'var(--destaque-1)'; }
        if (leftNostrilElement && rightNostrilElement) {
             leftNostrilElement.style.borderColor = breathingPaletteAlternate.inactive; leftNostrilElement.style.backgroundColor = `${breathingPaletteAlternate.inactive}33`;
             rightNostrilElement.style.borderColor = breathingPaletteAlternate.inactive; rightNostrilElement.style.backgroundColor = `${breathingPaletteAlternate.inactive}33`;
        }
    
        switch (selectedTechnique) {
             case 'alternate':
                 const alternatePhaseDuration = 4; currentPhaseDuration = alternatePhaseDuration;
                 if (currentPhase === 0) { instructionText = `Inspire Esquerda (${currentPhaseDuration}s)`; soundToPlay = sounds.inhale; nextPhase = 1; if(leftNostrilElement) { leftNostrilElement.style.borderColor = breathingPaletteAlternate.leftNostril; leftNostrilElement.style.backgroundColor = `${breathingPaletteAlternate.leftNostril}33`; } }
                 else if (currentPhase === 1) { instructionText = `Segure (${currentPhaseDuration}s)`; soundToPlay = sounds.hold; nextPhase = 2; if(leftNostrilElement) { leftNostrilElement.style.borderColor = breathingPaletteAlternate.hold; leftNostrilElement.style.backgroundColor = `${breathingPaletteAlternate.hold}33`; } }
                 else if (currentPhase === 2) { instructionText = `Expire Direita (${currentPhaseDuration}s)`; soundToPlay = sounds.exhale; nextPhase = 3; if(rightNostrilElement) { rightNostrilElement.style.borderColor = breathingPaletteAlternate.rightNostril; rightNostrilElement.style.backgroundColor = `${breathingPaletteAlternate.rightNostril}33`; } }
                 else if (currentPhase === 3) { instructionText = `Segure (${currentPhaseDuration}s)`; soundToPlay = sounds.hold; nextPhase = 4; if(rightNostrilElement) { rightNostrilElement.style.borderColor = breathingPaletteAlternate.hold; rightNostrilElement.style.backgroundColor = `${breathingPaletteAlternate.hold}33`; } }
                 else if (currentPhase === 4) { instructionText = `Inspire Direita (${currentPhaseDuration}s)`; soundToPlay = sounds.inhale; nextPhase = 5; if(rightNostrilElement) { rightNostrilElement.style.borderColor = breathingPaletteAlternate.rightNostril; rightNostrilElement.style.backgroundColor = `${breathingPaletteAlternate.rightNostril}33`; } }
                 else if (currentPhase === 5) { instructionText = `Segure (${currentPhaseDuration}s)`; soundToPlay = sounds.hold; nextPhase = 6; if(rightNostrilElement) { rightNostrilElement.style.borderColor = breathingPaletteAlternate.hold; rightNostrilElement.style.backgroundColor = `${breathingPaletteAlternate.hold}33`; } }
                 else if (currentPhase === 6) { instructionText = `Expire Esquerda (${currentPhaseDuration}s)`; soundToPlay = sounds.exhale; nextPhase = 7; if(leftNostrilElement) { leftNostrilElement.style.borderColor = breathingPaletteAlternate.leftNostril; leftNostrilElement.style.backgroundColor = `${breathingPaletteAlternate.leftNostril}33`; } }
                 else { instructionText = `Segure (${currentPhaseDuration}s)`; soundToPlay = sounds.hold; nextPhase = 0; if(leftNostrilElement) { leftNostrilElement.style.borderColor = breathingPaletteAlternate.hold; leftNostrilElement.style.backgroundColor = `${breathingPaletteAlternate.hold}33`; } }
                 break;
            case '478':
                 if (currentPhase === 0) { currentPhaseDuration = 4; instructionText = "Inspire (4s)"; soundToPlay = sounds.inhale; nextPhase = 1; if(breathingBox){ breathingBox.style.borderColor = breathingPalette478.inhale; breathingBox.style.backgroundColor = `${breathingPalette478.inhale}33`; } }
                 else if (currentPhase === 1) { currentPhaseDuration = 7; instructionText = "Segure (7s)"; soundToPlay = sounds.hold; nextPhase = 2; if(breathingBox){ breathingBox.style.borderColor = breathingPalette478.hold; breathingBox.style.backgroundColor = `${breathingPalette478.hold}33`; } }
                 else { currentPhaseDuration = 8; instructionText = "Expire (8s)"; soundToPlay = sounds.exhale; nextPhase = 0; if(breathingBox){ breathingBox.style.borderColor = breathingPalette478.exhale; breathingBox.style.backgroundColor = `${breathingPalette478.exhale}33`; } }
                break;
             case 'diaphragmatic':
                 const diaphragmaticPhaseDuration = 5; currentPhaseDuration = diaphragmaticPhaseDuration;
                 if (currentPhase === 0) { instructionText = `Inspire Profundamente (${currentPhaseDuration}s)`; soundToPlay = sounds.inhale; nextPhase = 1; if(breathingBox){ breathingBox.style.borderColor = breathingPaletteDiaphragmatic.inhale; breathingBox.style.backgroundColor = `${breathingPaletteDiaphragmatic.inhale}33`; breathingBox.style.borderRadius = '30%'; } }
                 else { instructionText = `Expire Lentamente (${currentPhaseDuration}s)`; soundToPlay = sounds.exhale; nextPhase = 0; if(breathingBox){ breathingBox.style.borderColor = breathingPaletteDiaphragmatic.exhale; breathingBox.style.backgroundColor = `${breathingPaletteDiaphragmatic.exhale}33`; breathingBox.style.borderRadius = '20%'; } }
                 break;
            case 'box':
            default:
                 currentPhaseDuration = getPhaseDurationSeconds(); nextPhase = (currentPhase + 1) % TOTAL_PHASES_BOX; let borderColorBox = "";
                 switch (currentPhase) { /*...*/ }
                 if (breathingBox) { breathingBox.style.borderColor = borderColorBox; breathingBox.style.backgroundColor = 'transparent'; }
                break;
        }
    
        if (instruction) instruction.textContent = instructionText;
        playSound(soundToPlay, currentPhaseDuration);
    
        if (currentPhaseDuration > 0) {
            phaseTimeoutId = setTimeout(() => {
                if (isBreathing) { currentPhase = nextPhase; phaseStartTime = performance.now(); updateBreathingPhase(); }
            }, currentPhaseDuration * 1000);
        } else { console.warn("Duração da fase é zero."); }
    } // Fim updateBreathingPhase
    
    /** Loop principal de animação - ATUALIZA VISUAL E CONTADOR DE FASE */
    function animationLoop(timestamp) {
        if (!isBreathing) { if (animationFrameId) cancelAnimationFrame(animationFrameId); animationFrameId = null; return; };
    
        // --- Cálculos de tempo e progresso geral ---
        const deltaTime = timestamp - lastAnimationFrameTimestamp; lastAnimationFrameTimestamp = timestamp; elapsedTimeSeconds += deltaTime / 1000;
        if (elapsedTimeSeconds >= totalDurationSeconds) { stopExercise(false); setUIState(UI_STATE.FINISHED); return; }
        if (timerDisplay) timerDisplay.textContent = formatTime(totalDurationSeconds - elapsedTimeSeconds); const progressPercent = Math.min(100, (elapsedTimeSeconds / totalDurationSeconds) * 100); if(progressBar){ progressBar.style.width = `${progressPercent}%`; progressBar.textContent = `${Math.round(progressPercent)}%`; }
    
        // --- Atualização do Contador de Fase ---
        if (phaseCountdownDisplay && currentPhaseDuration > 0) { const timeIntoPhaseSeconds = (timestamp - phaseStartTime) / 1000; let remainingPhaseSeconds = Math.ceil(currentPhaseDuration - timeIntoPhaseSeconds); remainingPhaseSeconds = Math.max(1, Math.min(remainingPhaseSeconds, currentPhaseDuration)); phaseCountdownDisplay.textContent = toRoman(remainingPhaseSeconds); if (phaseCountdownDisplay.style.display !== 'block') phaseCountdownDisplay.style.display = 'block'; }
        else if (phaseCountdownDisplay) { phaseCountdownDisplay.style.display = 'none'; }
    
        // --- Lógica de Animação Específica da Técnica ---
        switch(selectedTechnique) {
            case 'alternate': updateAlternateNostrilAnimation(timestamp); break;
            case '478':
            case 'diaphragmatic': updateScaleAnimation(timestamp); break;
            case 'box':
            default:
                if (!boxRect) break; if (progressIndicator && progressIndicator.style.display !== 'block') { progressIndicator.style.display = 'block'; }
                const phaseDurationMillisBox = currentPhaseDuration * 1000; const timeIntoPhaseBox = timestamp - phaseStartTime; const phaseProgressBox = Math.min(1, timeIntoPhaseBox / phaseDurationMillisBox);
                updateProgressIndicatorPosition(phaseProgressBox); break;
        }
    
        animationFrameId = requestAnimationFrame(animationLoop); // Continua o loop
    } // Fim animationLoop
    
    /** Atualiza a animação de escala (478, diaphragmatic) */
    function updateScaleAnimation(timestamp) {
         if (!breathingBox || currentPhaseDuration <= 0) return;
         const targetScale = 1.0; const initialScale = 0.5;
         const timeIntoPhase = timestamp - phaseStartTime; const phaseDurationMillis = currentPhaseDuration * 1000;
         const progress = Math.min(1.0, Math.max(0.0, timeIntoPhase / phaseDurationMillis));
         let currentScale = initialScale;
    
         if (selectedTechnique === '478') {
              if (currentPhase === 0) { currentScale = initialScale + progress * (targetScale - initialScale); } else if (currentPhase === 1) { currentScale = targetScale; } else { currentScale = targetScale - progress * (targetScale - initialScale); }
         } else if (selectedTechnique === 'diaphragmatic') {
              if (currentPhase === 0) { currentScale = initialScale + progress * (targetScale - initialScale); } else { currentScale = targetScale - progress * (targetScale - initialScale); }
         }
         breathingBox.style.transform = `translate(-50%, -50%) scale(${currentScale.toFixed(3)})`;
     }
    
    /** Atualiza a animação das narinas (Alternate Nostril) */
    function updateAlternateNostrilAnimation(timestamp) {
        if (!leftNostrilElement || !rightNostrilElement || currentPhaseDuration <= 0) return;
        const timeIntoPhase = timestamp - phaseStartTime; const phaseDurationMillis = currentPhaseDuration * 1000;
        const progress = Math.min(1.0, Math.max(0.0, timeIntoPhase / phaseDurationMillis));
        const initialScale = 0.6; const targetScale = 1.0;
        let currentScaleLeft = initialScale; let currentScaleRight = initialScale;
    
        // Define a escala ALVO e se há progresso baseado na fase
        let targetScaleLeft = initialScale; let targetScaleRight = initialScale;
        let useProgressLeft = false; let useProgressRight = false;
        // Ciclo: 0(InL), 1(HoldL), 2(ExR), 3(HoldR), 4(InR), 5(HoldR), 6(ExL), 7(HoldL)
        if (currentPhase === 0) { targetScaleLeft = targetScale; useProgressLeft = true; }
        else if (currentPhase === 1) { targetScaleLeft = targetScale; }
        else if (currentPhase === 2) { targetScaleRight = initialScale; useProgressRight = true; targetScaleLeft = targetScale; } // Direita diminui, Esquerda mantém grande
        else if (currentPhase === 3) { targetScaleRight = initialScale; targetScaleLeft = targetScale; }
        else if (currentPhase === 4) { targetScaleRight = targetScale; useProgressRight = true; }
        else if (currentPhase === 5) { targetScaleRight = targetScale; }
        else if (currentPhase === 6) { targetScaleLeft = initialScale; useProgressLeft = true; targetScaleRight = targetScale; } // Esquerda diminui, Direita mantém grande
        else { /* currentPhase === 7 */ targetScaleLeft = initialScale; targetScaleRight = targetScale; }
    
        // Calcula escala atual baseada no progresso (interpolando)
        currentScaleLeft = useProgressLeft
            ? (currentPhase === 0 ? initialScale + progress * (targetScale - initialScale) : targetScale - progress * (targetScale - initialScale))
            : targetScaleLeft; // Se não usa progresso, assume escala alvo diretamente
        currentScaleRight = useProgressRight
             ? (currentPhase === 4 ? initialScale + progress * (targetScale - initialScale) : targetScale - progress * (targetScale - initialScale))
             : targetScaleRight; // Se não usa progresso, assume escala alvo diretamente
    
        leftNostrilElement.style.transform = `translate(-50%, -50%) scale(${currentScaleLeft.toFixed(3)})`;
        rightNostrilElement.style.transform = `translate(-50%, -50%) scale(${currentScaleRight.toFixed(3)})`;
    }
    
    /** Atualiza a posição do ponto no perímetro (Box) */
    function updateProgressIndicatorPosition(progress) {
         if (!progressIndicator || !boxRect) return;
         let x, y; const { relativeLeft: bL, relativeRight: bR, relativeTop: bT, relativeBottom: bB, relativeWidth: bW, relativeHeight: bH } = boxRect;
         const totalProgress = currentPhase + progress;
         if (totalProgress < 1) { x = bL + (totalProgress * bW); y = bT; } else if (totalProgress < 2) { x = bR; y = bT + ((totalProgress - 1) * bH); }
         else if (totalProgress < 3) { x = bR - ((totalProgress - 2) * bW); y = bB; } else { x = bL; y = bB - ((totalProgress - 3) * bH); }
         progressIndicator.style.left = `calc(${x}% - ${progressIndicator.offsetWidth / 2}px)`; progressIndicator.style.top = `calc(${y}% - ${progressIndicator.offsetHeight / 2}px)`;
     }
    
    /** Para o exercício, limpa timers/animação e reseta o estado */
    function stopExercise(resetToIdle = true) {
         const lastTechnique = selectedTechnique;
         isBreathing = false;
         if (countdownIntervalId) clearInterval(countdownIntervalId); if (phaseTimeoutId) clearTimeout(phaseTimeoutId); if (animationFrameId) cancelAnimationFrame(animationFrameId);
         countdownIntervalId = null; phaseTimeoutId = null; animationFrameId = null;
         stopAllSounds();
         removeAlternateNostrilElements(); // Garante remoção ao parar
         if (resetToIdle) {
              configureInitialStateForTechnique(lastTechnique); // Reseta visual para a técnica que estava ativa
              setUIState(UI_STATE.IDLE);
         } else { if (phaseCountdownDisplay) phaseCountdownDisplay.style.display = 'none'; }
         console.log("Exercício parado.");
     }
    
    // --- Event Listeners ---
    if(startBtn) startBtn.addEventListener('click', startExercise); else console.error("Botão Iniciar não encontrado!");
    if(stopBtn) stopBtn.addEventListener('click', () => stopExercise(true));
    if(themeToggleBtn) themeToggleBtn.addEventListener('click', () => { const current = htmlElement.dataset.theme || 'light'; const nextTheme = current === 'light' ? 'dark' : 'light'; applyTheme(nextTheme); applyCategoryPalette(currentCategory); });
    if(techniqueSelect) techniqueSelect.addEventListener('change', (event) => { selectedTechnique = event.target.value; const newCategory = techniqueCategories[selectedTechnique] || 'focus'; removeAlternateNostrilElements(); applyCategoryPalette(newCategory); configureInitialStateForTechnique(selectedTechnique); if (currentUIState === UI_STATE.IDLE && durationSelect && timerDisplay){ timerDisplay.textContent = formatTime(parseInt(durationSelect.value, 10)); } console.log(`Técnica alterada para: ${selectedTechnique}`); });
    if(durationSelect) durationSelect.addEventListener('change', (event) => { if (currentUIState === UI_STATE.IDLE && timerDisplay){ timerDisplay.textContent = formatTime(parseInt(event.target.value, 10)); } });
    if(toggleAdvancedBtn && advancedControls) toggleAdvancedBtn.addEventListener('click', () => { const isHidden = advancedControls.style.display === 'none' || advancedControls.style.display === ''; advancedControls.style.display = isHidden ? 'block' : 'none'; toggleAdvancedBtn.textContent = isHidden ? 'Esconder Controles Avançados' : 'Mostrar Controles Avançados'; if(isHidden){ toggleAdvancedControlsVisibility(selectedTechnique); } });
    if(phaseDurationInput && phaseDurationValue) phaseDurationInput.addEventListener('input', () => { if(phaseDurationValue) phaseDurationValue.textContent = phaseDurationInput.value; });
    
    // --- Inicialização ---
    const initialTheme = getInitialTheme(); applyTheme(initialTheme);
    selectedTechnique = techniqueSelect ? techniqueSelect.value : 'box';
    currentCategory = techniqueCategories[selectedTechnique] || 'focus';
    applyCategoryPalette(currentCategory); // Chama updateBoxDimensions com delay
    configureInitialStateForTechnique(selectedTechnique); // Configura visual inicial
    setUIState(UI_STATE.IDLE); // Define estado inicial
    if(phaseDurationInput && phaseDurationValue) { phaseDurationValue.textContent = phaseDurationInput.value; }
    window.addEventListener('resize', updateBoxDimensions);
    console.log("App de Respiração inicializado (v8.1 FINAL).");
    }); // Fim do DOMContentLoaded
    
    