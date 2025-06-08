// script-simplified.js - Versão Simplificada focada em Box Breathing
document.addEventListener('DOMContentLoaded', () => {

    // --- Constantes ---
    const THEME_STORAGE_KEY = 'themePreference';
    const PHASE = { INHALE: 0, HOLD_IN: 1, EXHALE: 2, HOLD_OUT: 3 };
    const TOTAL_PHASES_BOX = 4;
    const UI_STATE = { IDLE: 'idle', PREPARING: 'preparing', BREATHING: 'breathing', FINISHED: 'finished' };
    const SOUND_VOLUME_MULTIPLIER = 0.8;
    const BEEP_VOLUME_MULTIPLIER = 0.2;
    
    // --- Elementos DOM ---
    const htmlElement = document.documentElement;
    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');
    const breathingBox = document.getElementById('breathing-box');
    const progressIndicator = document.getElementById('progress-indicator');
    const instruction = document.getElementById('instruction');
    const timerDisplay = document.getElementById('timer');
    const countdownDisplay = document.getElementById('countdown');
    const countdownNumber = document.getElementById('countdown-number');
    const progressBar = document.getElementById('progress-bar');
    const durationSelect = document.getElementById('duration-select');
    const patternSelect = document.getElementById('pattern-select');
    const phaseCountdownDisplay = document.getElementById('phase-countdown');
    const boxContainer = document.getElementById('box-container');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const saibaMais = document.getElementById('saiba-mais');
    
    // --- Variáveis de Estado ---
    let isBreathing = false;
    let currentPhase = 0;
    let totalDurationSeconds = 0;
    let elapsedTimeSeconds = 0;
    let animationFrameId = null;
    let phaseTimeoutId = null;
    let countdownIntervalId = null;
    let currentUIState = UI_STATE.IDLE;
    let currentPhaseDuration = 4; // Valor padrão
    let animationStartTime = 0;
    let lastAnimationFrameTimestamp = 0;
    let phaseStartTime = 0;
    let audioCtx = null;
    const sounds = { inhale: null, exhale: null, hold: null, vertex: null };
    let boxRect = null;
    let containerRect = null;
    let isMuted = localStorage.getItem('mutePreference') === 'true';
    
    // --- Funções de Som ---
    function updateMuteButton() {
        const muteBtn = document.getElementById('mute-btn');
        if (muteBtn) {
            muteBtn.textContent = isMuted ? 'Som: Off' : 'Som: On';
        }
    }

    function toggleMute() {
        isMuted = !isMuted;
        localStorage.setItem('mutePreference', isMuted);
        updateMuteButton();
    }
    
    function initAudio() {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) {
                console.warn("Web Audio API não suportada.");
                return;
            }
            if (!audioCtx) {
                audioCtx = new AudioCtx();

                const lowPass = audioCtx.createBiquadFilter();
                lowPass.type = "lowpass";
                lowPass.frequency.value = 500;
                lowPass.Q.value = 1;
                lowPass.connect(audioCtx.destination);

                const createSound = (waveType, baseFreq, targetFreq = baseFreq) => {
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    osc.type = waveType;
                    osc.frequency.value = baseFreq;
                    gain.gain.value = 0;
                    osc.connect(gain);
                    gain.connect(lowPass);
                    osc.start();
                    return { oscillator: osc, gainNode: gain, baseFreq, targetFreq };
                };

                sounds.inhale = createSound('sine', 174.61, 196.00);
                sounds.exhale = createSound('sine', 196.00, 174.61);
                sounds.hold = createSound('sine', 130.81);
                sounds.vertex = createSound('triangle', 261.63);
            }
        } catch (e) {
            console.error("Erro ao inicializar o AudioContext:", e);
        }
    }

    function playSound(soundData, durationSeconds) {
        if (isMuted) return;
        if (!audioCtx || !soundData || !soundData.gainNode) return;
        const now = audioCtx.currentTime;
        const maxGain = 0.08;
        const { oscillator, gainNode, baseFreq, targetFreq } = soundData;

        oscillator.frequency.cancelScheduledValues(now);
        oscillator.frequency.setValueAtTime(baseFreq, now);
        if (targetFreq && durationSeconds > 0.05) {
            oscillator.frequency.linearRampToValueAtTime(targetFreq, now + durationSeconds);
        }
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(maxGain, now + 0.05);
        if (durationSeconds > 0.15) {
            gainNode.gain.setValueAtTime(maxGain, now + durationSeconds - 0.1);
            gainNode.gain.linearRampToValueAtTime(0, now + durationSeconds);
        } else {
            gainNode.gain.linearRampToValueAtTime(0, now + durationSeconds);
        }
    }

    function playVertexSound() {
        if (isMuted) return;
        if (!audioCtx || !sounds.vertex || !sounds.vertex.gainNode) return;
        const { oscillator, gainNode, baseFreq } = sounds.vertex;
        const now = audioCtx.currentTime;
        oscillator.frequency.setValueAtTime(baseFreq, now);
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.25 * SOUND_VOLUME_MULTIPLIER * BEEP_VOLUME_MULTIPLIER, now + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.15);
    }
    
    function stopAllSounds() {
        if (!audioCtx) return;
        const now = audioCtx.currentTime;
        Object.values(sounds).forEach(soundData => {
            if (soundData && soundData.gainNode) {
                soundData.gainNode.gain.cancelScheduledValues(now);
                soundData.gainNode.gain.linearRampToValueAtTime(0, now + 0.05);
            }
        });
    }
    
    // --- Funções de Tema ---
    const getInitialTheme = () => {
        const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
        if (storedTheme) return storedTheme;
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        return prefersDark ? 'dark' : 'light';
    };
    
    const applyTheme = (theme) => {
        htmlElement.dataset.theme = theme;
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    };
    
    // --- Funções de UI ---
    function toRoman(num) {
        const romanMap = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X' };
        return romanMap[num] || (num > 0 ? num.toString() : 'I');
    }
    
    function getPhaseDurationSeconds() {
        return parseInt(patternSelect.value, 10);
    }
    
    function setUIState(newState) {
        currentUIState = newState;
        
        if(startBtn) startBtn.classList.add('hidden');
        if(stopBtn) stopBtn.classList.add('hidden');
        if(countdownDisplay) countdownDisplay.classList.add('hidden');
        if (phaseCountdownDisplay) phaseCountdownDisplay.style.display = 'none';
    
        if (breathingBox) {
            breathingBox.classList.remove('idle-animation');
            if (newState === UI_STATE.IDLE) {
                breathingBox.classList.add('idle-animation');
            }
        }
    
        switch (newState) {
            case UI_STATE.IDLE:
                if(startBtn) startBtn.classList.remove('hidden');
                if (instruction) {
                    const timeText = formatTime(parseInt(durationSelect.value, 10));
                    instruction.innerHTML = `Pronto para começar?<br><span class="idle-timer">${timeText}</span>`;
                }
                if (progressBar) {
                    progressBar.style.width = '0%';
                    progressBar.textContent = '0%';
                }
                break;
            case UI_STATE.PREPARING:
                if(countdownDisplay) countdownDisplay.classList.remove('hidden');
                if(instruction) instruction.textContent = "Prepare-se...";
                break;
            case UI_STATE.BREATHING:
                if(stopBtn) stopBtn.classList.remove('hidden');
                if (phaseCountdownDisplay) phaseCountdownDisplay.style.display = 'block';
                break;
            case UI_STATE.FINISHED:
                if(startBtn) startBtn.classList.remove('hidden');
                if(instruction) instruction.textContent = "Exercício finalizado!";
                break;
        }
    }
    
    function formatTime(totalSeconds) {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = Math.floor(totalSeconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    function resetIndicatorPosition() {
        if (progressIndicator) {
            progressIndicator.style.left = '0px';
            progressIndicator.style.top = '0px';
            progressIndicator.style.display = 'block';
        }
    }
    
    function updateBoxDimensions() {
        requestAnimationFrame(() => {
            if (!breathingBox || !boxContainer) {
                console.error("Elementos da caixa de animação não encontrados.");
                boxRect = null;
                return;
            }
            
            // Obtém as dimensões reais da caixa
            const boxBounds = breathingBox.getBoundingClientRect();
            const containerBounds = boxContainer.getBoundingClientRect();
            
            // Calcula as posições relativas ao container
            boxRect = {
                left: boxBounds.left - containerBounds.left,
                right: boxBounds.right - containerBounds.left,
                top: boxBounds.top - containerBounds.top,
                bottom: boxBounds.bottom - containerBounds.top,
                width: boxBounds.width,
                height: boxBounds.height,
                centerX: (boxBounds.left + boxBounds.right) / 2 - containerBounds.left,
                centerY: (boxBounds.top + boxBounds.bottom) / 2 - containerBounds.top
            };
            
            // Ajusta para considerar a borda da caixa (4px)
            const borderWidth = 4;
            boxRect.left += borderWidth / 2;
            boxRect.right -= borderWidth / 2;
            boxRect.top += borderWidth / 2;
            boxRect.bottom -= borderWidth / 2;
            boxRect.width -= borderWidth;
            boxRect.height -= borderWidth;
        });
    }
    
    // --- Funções do Exercício ---
    function configureInitialStateForTechnique() {
        if (!breathingBox || !progressIndicator || !phaseCountdownDisplay || !boxContainer) {
            console.error("Erro ao configurar técnica: Elementos visuais principais não encontrados.");
            return;
        }
    
        breathingBox.style.display = 'block';
        progressIndicator.style.display = 'block';
        phaseCountdownDisplay.style.display = 'none';
        breathingBox.style.transform = 'translate(-50%, -50%) scale(1)';
        breathingBox.style.borderRadius = '10px';
        breathingBox.style.borderColor = 'var(--destaque-1)';
        breathingBox.style.backgroundColor = 'transparent';
        breathingBox.style.transition = 'border-color 0.5s ease, transform 0.5s ease-in-out';
        
        currentPhase = PHASE.INHALE;
        resetIndicatorPosition();
        resetPhaseMarkers();
    }
    
    function startExercise() {
        if (isBreathing) return;
        
        totalDurationSeconds = parseInt(durationSelect.value, 10);
        elapsedTimeSeconds = 0;
        currentPhaseDuration = getPhaseDurationSeconds();
        
        if (isNaN(totalDurationSeconds) || totalDurationSeconds <= 0) {
            alert("Selecione duração válida.");
            return;
        }
        
        configureInitialStateForTechnique();
        setUIState(UI_STATE.PREPARING);
        
        if (!audioCtx) initAudio();
        
        let countdownValue = 3;
        if (countdownNumber) countdownNumber.textContent = countdownValue;
        
        if (countdownIntervalId) clearInterval(countdownIntervalId);
        countdownIntervalId = setInterval(() => {
            countdownValue--;
            if (countdownNumber) countdownNumber.textContent = countdownValue;
            if (countdownValue <= 0) {
                clearInterval(countdownIntervalId);
                countdownIntervalId = null;
                setTimeout(() => {
                    updateBoxDimensions();
                    setTimeout(() => {
                        if (!boxRect) {
                            console.error("Falha ao obter dimensões da caixa.");
                            stopExercise(true);
                        } else {
                            startBreathingAnimation();
                        }
                    }, 100);
                }, 60);
            }
        }, 1000);
    }
    
    function startBreathingAnimation() {
        isBreathing = true;
        setUIState(UI_STATE.BREATHING);
        animationStartTime = performance.now();
        lastAnimationFrameTimestamp = animationStartTime;
        phaseStartTime = animationStartTime;
        updateBreathingPhase();
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(animationLoop);
    }
    
    function updateBreathingPhase() {
        if (!isBreathing) return;
        if (!breathingBox) return;
        
        if (phaseTimeoutId) clearTimeout(phaseTimeoutId);
        playVertexSound();
        
        currentPhaseDuration = getPhaseDurationSeconds();
        let instructionText = "";
        let soundToPlay = null;
        let nextPhase = (currentPhase + 1) % TOTAL_PHASES_BOX;
        let borderColorBox = 'var(--destaque-1)';
        
        breathingBox.style.backgroundColor = 'transparent';
        
        if (currentPhase === PHASE.INHALE) {
            instructionText = `Inspire (${currentPhaseDuration}s)`;
            soundToPlay = sounds.inhale;
            borderColorBox = '#174073';
        } else if (currentPhase === PHASE.HOLD_IN) {
            instructionText = `Segure (${currentPhaseDuration}s)`;
            soundToPlay = sounds.hold;
            borderColorBox = '#989FB1';
        } else if (currentPhase === PHASE.EXHALE) {
            instructionText = `Expire (${currentPhaseDuration}s)`;
            soundToPlay = sounds.exhale;
            borderColorBox = '#CDA561';
        } else {
            instructionText = `Segure (${currentPhaseDuration}s)`;
            soundToPlay = sounds.hold;
            borderColorBox = '#989FB1';
        }
        
        if (breathingBox) {
            breathingBox.style.borderColor = borderColorBox;
            breathingBox.style.backgroundColor = `${borderColorBox}33`;
        }
        
        if (instruction) instruction.textContent = instructionText;
        playSound(soundToPlay, currentPhaseDuration);
        
        if (currentPhaseDuration > 0) {
            phaseTimeoutId = setTimeout(() => {
                if (isBreathing) {
                    currentPhase = nextPhase;
                    phaseStartTime = performance.now();
                    updateBreathingPhase();
                }
            }, currentPhaseDuration * 1000);
        }
    }
    
    function animationLoop(timestamp) {
        if (!isBreathing) {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
            return;
        }
        
        const deltaTime = timestamp - lastAnimationFrameTimestamp;
        lastAnimationFrameTimestamp = timestamp;
        elapsedTimeSeconds += deltaTime / 1000;
        
        if (elapsedTimeSeconds >= totalDurationSeconds) {
            stopExercise(false);
            setUIState(UI_STATE.FINISHED);
            return;
        }
        
        if (timerDisplay) timerDisplay.textContent = formatTime(totalDurationSeconds - elapsedTimeSeconds);
        const progressPercent = Math.min(100, (elapsedTimeSeconds / totalDurationSeconds) * 100);
        if(progressBar) {
            progressBar.style.width = `${progressPercent}%`;
            progressBar.textContent = `${Math.round(progressPercent)}%`;
        }
        
        // Atualização do Contador de Fase
        if (phaseCountdownDisplay && currentPhaseDuration > 0) {
            const timeIntoPhaseSeconds = (timestamp - phaseStartTime) / 1000;
            let remainingPhaseSeconds = Math.ceil(currentPhaseDuration - timeIntoPhaseSeconds);
            remainingPhaseSeconds = Math.max(1, Math.min(remainingPhaseSeconds, currentPhaseDuration));
            phaseCountdownDisplay.textContent = toRoman(remainingPhaseSeconds);
            if (phaseCountdownDisplay.style.display !== 'block') phaseCountdownDisplay.style.display = 'block';
        }
        
        // Atualização do indicador de progresso (bolinha)
        if (!boxRect) updateBoxDimensions();
        if (progressIndicator && boxRect) {
            const phaseDurationMillis = currentPhaseDuration * 1000;
            const timeIntoPhase = timestamp - phaseStartTime;
            const phaseProgress = Math.min(1, timeIntoPhase / phaseDurationMillis);
            updateProgressIndicatorPosition(phaseProgress);
        }
        
        updatePhaseMarkers(timestamp);
        animationFrameId = requestAnimationFrame(animationLoop);
    }
    
    function updateProgressIndicatorPosition(progress) {
        if (!progressIndicator || !boxRect) return;
        
        // Tamanho do indicador
        const indicatorSize = 18;
        const halfIndicator = indicatorSize / 2;
        
        // Cálculo do progresso total (0-4)
        const totalProgress = currentPhase + progress;
        
        let x, y;
        
        if (totalProgress < 1) {
            // Lado superior (esquerda para direita)
            const t = totalProgress;
            x = boxRect.left + (t * boxRect.width);
            y = boxRect.top;
        } else if (totalProgress < 2) {
            // Lado direito (cima para baixo)
            const t = totalProgress - 1;
            x = boxRect.right;
            y = boxRect.top + (t * boxRect.height);
        } else if (totalProgress < 3) {
            // Lado inferior (direita para esquerda)
            const t = totalProgress - 2;
            x = boxRect.right - (t * boxRect.width);
            y = boxRect.bottom;
        } else {
            // Lado esquerdo (baixo para cima)
            const t = totalProgress - 3;
            x = boxRect.left;
            y = boxRect.bottom - (t * boxRect.height);
        }
        
        // Aplica posição considerando o centro do indicador
        progressIndicator.style.left = `${x - halfIndicator}px`;
        progressIndicator.style.top = `${y - halfIndicator}px`;
        progressIndicator.style.transform = 'none'; // Remove o translate para evitar conflitos
    }
    
    function stopExercise(resetToIdle = true) {
        isBreathing = false;
        if (countdownIntervalId) clearInterval(countdownIntervalId);
        if (phaseTimeoutId) clearTimeout(phaseTimeoutId);
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        countdownIntervalId = null;
        phaseTimeoutId = null;
        animationFrameId = null;
        stopAllSounds();
        
        if (resetToIdle) {
            configureInitialStateForTechnique();
            setUIState(UI_STATE.IDLE);
        } else {
            if (phaseCountdownDisplay) phaseCountdownDisplay.style.display = 'none';
        }
    }
    
    function updatePhaseMarkers(timestamp) {
        const markers = document.querySelectorAll('.phase-marker');
        if (!markers.length || !isBreathing) return;

        const timeIntoPhaseSeconds = (timestamp - phaseStartTime) / 1000;
        const phaseProgress = (currentPhaseDuration > 0) ? 
            Math.min(1, timeIntoPhaseSeconds / currentPhaseDuration) : 0;
        
        markers.forEach((marker) => {
            marker.classList.remove('active');
            const fill = marker.querySelector('.marker-fill');
            if (fill) {
                fill.style.width = '0%';
            }
        });

        if (currentPhase >= 0 && currentPhase < markers.length) {
            const currentMarker = markers[currentPhase];
            if (currentMarker) {
                currentMarker.classList.add('active');
                const fill = currentMarker.querySelector('.marker-fill');
                if (fill) {
                    fill.style.width = `${phaseProgress * 100}%`;
                }
            }
        }
    }

    function resetPhaseMarkers() {
        const markers = document.querySelectorAll('.phase-marker');
        markers.forEach(marker => {
            marker.classList.remove('active');
            const fill = marker.querySelector('.marker-fill');
            if (fill) {
                fill.style.width = '0%';
            }
        });
    }
    
    // --- Event Listeners ---
    if(startBtn) startBtn.addEventListener('click', startExercise);
    if(stopBtn) stopBtn.addEventListener('click', () => stopExercise(true));
    
    if(themeToggleBtn) themeToggleBtn.addEventListener('click', () => {
        const current = htmlElement.dataset.theme || 'light';
        const nextTheme = current === 'light' ? 'dark' : 'light';
        applyTheme(nextTheme);
    });
    
    if(durationSelect) durationSelect.addEventListener('change', (event) => {
        if (currentUIState === UI_STATE.IDLE && timerDisplay) {
            timerDisplay.textContent = formatTime(parseInt(event.target.value, 10));
        }
    });
    
    if(patternSelect) patternSelect.addEventListener('change', () => {
        if (currentUIState === UI_STATE.IDLE) {
            currentPhaseDuration = getPhaseDurationSeconds();
        }
    });
    
    const muteBtn = document.getElementById('mute-btn');
    if (muteBtn) muteBtn.addEventListener('click', toggleMute);
    updateMuteButton();
    
    // Toggle Saiba Mais
    if (saibaMais) {
        saibaMais.addEventListener('click', () => {
            saibaMais.classList.toggle('expanded');
            const expandIcon = saibaMais.querySelector('.expand-icon');
            if (expandIcon) {
                expandIcon.textContent = saibaMais.classList.contains('expanded') ? '▲' : '▼';
            }
        });
    }
    
    // --- Inicialização ---
    const initialTheme = getInitialTheme();
    applyTheme(initialTheme);
    htmlElement.dataset.category = 'focus'; // Box Breathing sempre usa paleta focus
    
    configureInitialStateForTechnique();
    setUIState(UI_STATE.IDLE);
    
    window.addEventListener('resize', updateBoxDimensions);
    console.log("Box Breathing App - Versão Simplificada Inicializada");
});