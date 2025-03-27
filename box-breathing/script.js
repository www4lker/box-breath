// Elementos DOM
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const toggleAdvancedBtn = document.getElementById('toggle-advanced');
const breathingBox = document.getElementById('breathing-box');
const progressIndicator = document.getElementById('progress-indicator');
const instruction = document.getElementById('instruction');
const timer = document.getElementById('timer');
const countdown = document.getElementById('countdown');
const countdownNumber = document.getElementById('countdown-number');
const progressBar = document.getElementById('progress-bar');
const durationSelect = document.getElementById('duration-select');
const advancedControls = document.getElementById('advanced-controls');
const phaseDurationInput = document.getElementById('phase-duration');
const phaseDurationValue = document.getElementById('phase-duration-value');
const themeToggleBtn = document.getElementById('theme-toggle');

// Variáveis para controle do estado
let isBreathing = false;
let currentPhase = 0; // 0: inhale, 1: hold1, 2: exhale, 3: hold2
let totalTime = 0;
let elapsedTime = 0;
let animationFrameId = null;
let startTime = 0;
let lastTimestamp = 0;
let phaseStartTime = 0;
let currentTimer = null;

// Sons
let inhaleSound, exhaleSound, holdSound, vertexSound;

// Alternar tema claro/escuro
themeToggleBtn.addEventListener('click', () => {
    const htmlElement = document.documentElement;
    if (htmlElement.getAttribute('data-theme') === 'dark') {
        htmlElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
    } else {
        htmlElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    }
});

// Verificar tema preferido no armazenamento local
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
}

// Inicializar sons (usando o oscilador do Web Audio API para simplicidade)
function initSounds() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioContext();
    
    // Som para inspirar (tom crescente)
    inhaleSound = {
        play: function() {
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(220, audioCtx.currentTime);
            oscillator.frequency.linearRampToValueAtTime(440, audioCtx.currentTime + getPhaseDuration());
            
            gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.1);
            gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + getPhaseDuration());
            
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + getPhaseDuration());
            
            this.oscillator = oscillator;
        },
        stop: function() {
            if (this.oscillator) {
                try {
                    this.oscillator.stop();
                } catch (e) {}
            }
        }
    };
    
    // Som para expirar (tom decrescente)
    exhaleSound = {
        play: function() {
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
            oscillator.frequency.linearRampToValueAtTime(220, audioCtx.currentTime + getPhaseDuration());
            
            gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.1);
            gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + getPhaseDuration());
            
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + getPhaseDuration());
            
            this.oscillator = oscillator;
        },
        stop: function() {
            if (this.oscillator) {
                try {
                    this.oscillator.stop();
                } catch (e) {}
            }
        }
    };
    
    // Som para segurar (tom constante)
    holdSound = {
        play: function() {
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.value = 330;
            
            gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.1);
            
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            oscillator.start();
            
            this.oscillator = oscillator;
            this.gainNode = gainNode;
        },
        stop: function() {
            if (this.oscillator && this.gainNode) {
                this.gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.1);
                setTimeout(() => {
                    try {
                        this.oscillator.stop();
                    } catch (e) {}
                }, 100);
            }
        }
    };
    
    // Som para vértice (beep curto mais distinto)
    vertexSound = {
        play: function() {
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            oscillator.type = 'square';
            oscillator.frequency.value = 660;
            
            gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.25, audioCtx.currentTime + 0.01);
            gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.15);
            
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.15);
        }
    };
}

// Obter duração padrão da fase
function getPhaseDuration() {
    return parseInt(phaseDurationInput.value);
}

// Função para inicializar a animação
function initAnimation() {
    // Inicializar sons
    initSounds();
    
    currentPhase = 0;
    elapsedTime = 0;
    totalTime = parseInt(durationSelect.value) * 60; // Converter minutos para segundos
    
    // Esconder botão de iniciar e mostrar botão de parar
    startBtn.classList.add('hidden');
    
    // Iniciar a contagem regressiva
    countdown.classList.remove('hidden');
    let countdownValue = 3;
    countdownNumber.textContent = countdownValue;
    
    const countdownInterval = setInterval(() => {
        countdownValue--;
        countdownNumber.textContent = countdownValue;
        
        if (countdownValue <= 0) {
            clearInterval(countdownInterval);
            countdown.classList.add('hidden');
            stopBtn.classList.remove('hidden');
            
            // Iniciar a respiração
            isBreathing = true;
            startBreathingCycle();
            startTime = performance.now();
            lastTimestamp = startTime;
            phaseStartTime = startTime;
            requestAnimationFrame(updateAnimation);
        }
    }, 1000);
}

// Função para iniciar um ciclo de respiração
function startBreathingCycle() {
    // Configurar a primeira fase (inspirar)
    updateBreathingPhase();
}

// Parar todos os sons
function stopAllSounds() {
    if (inhaleSound) inhaleSound.stop();
    if (exhaleSound) exhaleSound.stop();
    if (holdSound) holdSound.stop();
}

// Atualizar a fase atual da respiração
function updateBreathingPhase() {
    // Limpar qualquer timer anterior
    if (currentTimer) {
        clearTimeout(currentTimer);
    }
    
    // Parar todos os sons
    stopAllSounds();
    
    // Tocar som de vértice no início de cada fase
    vertexSound.play();
    
    // Atualizar a posição inicial do indicador
    updateProgressIndicatorPosition(0);
    
    // Reiniciar o tempo da fase
    phaseStartTime = performance.now();
    
    // Atualizar visual baseado na fase atual
    // Com apenas 4 fases: Inspire, Segure, Expire, Segure
    switch (currentPhase) {
        case 0: // Inspirar
            instruction.textContent = "Inspire";
            breathingBox.style.borderColor = "var(--destaque-1)";
            inhaleSound.play();
            break;
        case 1: // Segurar após inspirar
            instruction.textContent = "Segure";
            breathingBox.style.borderColor = "var(--complementar-1)";
            holdSound.play();
            break;
        case 2: // Expirar
            instruction.textContent = "Expire";
            breathingBox.style.borderColor = "var(--destaque-2)";
            exhaleSound.play();
            break;
        case 3: // Segurar após expirar
            instruction.textContent = "Segure";
            breathingBox.style.borderColor = "var(--complementar-2)";
            holdSound.play();
            break;
    }
    
    // Configurar timer para a próxima fase
    const phaseDuration = getPhaseDuration();
    currentTimer = setTimeout(() => {
        if (isBreathing) {
            currentPhase = (currentPhase + 1) % 4; // Ciclo de 4 fases
            updateBreathingPhase();
        }
    }, phaseDuration * 1000);
}

// Atualizar a posição do indicador de progresso com base no progresso da fase atual
function updateProgressIndicatorPosition(progress) {
    // Calcular posição exata no perímetro do retângulo
    const boxRect = breathingBox.getBoundingClientRect();
    const containerRect = document.getElementById('box-container').getBoundingClientRect();
    
    // Ajustar para posições relativas ao container
    const boxLeft = (boxRect.left - containerRect.left) / containerRect.width * 100;
    const boxRight = (boxRect.right - containerRect.left) / containerRect.width * 100;
    const boxTop = (boxRect.top - containerRect.top) / containerRect.height * 100;
    const boxBottom = (boxRect.bottom - containerRect.top) / containerRect.height * 100;
    
    let x, y;
    const phasePosition = currentPhase + progress;
    
    // Posicionar o cursor exatamente no perímetro do retângulo
    if (phasePosition < 1) {
        // Fase 0: Inspire - Lado superior
        x = boxLeft + (phasePosition * (boxRight - boxLeft));
        y = boxTop;
    } else if (phasePosition < 2) {
        // Fase 1: Segure - Lado direito
        x = boxRight;
        y = boxTop + ((phasePosition - 1) * (boxBottom - boxTop));
    } else if (phasePosition < 3) {
        // Fase 2: Expire - Lado inferior
        x = boxRight - ((phasePosition - 2) * (boxRight - boxLeft));
        y = boxBottom;
    } else {
        // Fase 3: Segure - Lado esquerdo
        x = boxLeft;
        y = boxBottom - ((phasePosition - 3) * (boxBottom - boxTop));
    }
    
    // Posicionar o indicador
    progressIndicator.style.left = `${x}%`;
    progressIndicator.style.top = `${y}%`;
}

// Função de animação principal (loop)
function updateAnimation(timestamp) {
    if (!isBreathing) return;
    
    // Calcular tempo decorrido
    const deltaTime = timestamp - lastTimestamp;
    lastTimestamp = timestamp;
    
    // Atualizar tempo decorrido
    elapsedTime += deltaTime / 1000; // Converter para segundos
    
    // Verificar se atingiu o tempo total
    if (elapsedTime >= totalTime) {
        endBreathing();
        return;
    }
    
    // Atualizar timer
    updateTimer();
    
    // Atualizar barra de progresso
    const progressPercent = (elapsedTime / totalTime) * 100;
    progressBar.style.width = `${progressPercent}%`;
    progressBar.textContent = `${Math.round(progressPercent)}%`;
    
    // Atualizar posição do indicador de progresso na fase atual
    const phaseDuration = getPhaseDuration() * 1000; // em milissegundos
    const phaseProgress = Math.min(1, (timestamp - phaseStartTime) / phaseDuration);
    updateProgressIndicatorPosition(phaseProgress);
    
    // Continuar loop de animação
    animationFrameId = requestAnimationFrame(updateAnimation);
}

// Atualizar o timer na tela
function updateTimer() {
    const remainingTime = Math.max(0, totalTime - elapsedTime);
    const minutes = Math.floor(remainingTime / 60);
    const seconds = Math.floor(remainingTime % 60);
    
    timer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Finalizar a respiração
function endBreathing() {
    isBreathing = false;
    
    // Parar todos os sons
    stopAllSounds();
    
    // Atualizar UI
    instruction.textContent = "Exercício finalizado!";
    stopBtn.classList.add('hidden');
    startBtn.classList.remove('hidden');
    
    // Cancelar animação
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
}

// Parar o exercício
function stopBreathing() {
    endBreathing();
}

// =========== Event Listeners ===========

// Iniciar exercício
startBtn.addEventListener('click', initAnimation);

// Parar exercício
stopBtn.addEventListener('click', stopBreathing);

// Mostrar/Esconder controles avançados
toggleAdvancedBtn.addEventListener('click', () => {
    if (advancedControls.style.display === 'block') {
        advancedControls.style.display = 'none';
        toggleAdvancedBtn.textContent = 'Mostrar Controles Avançados';
    } else {
        advancedControls.style.display = 'block';
        toggleAdvancedBtn.textContent = 'Esconder Controles Avançados';
    }
});

// Atualizar valor exibido do slider de duração da fase
phaseDurationInput.addEventListener('input', () => {
    phaseDurationValue.textContent = phaseDurationInput.value;
});
