// js/engines/AnimationEngine.js
import { PHASE_TYPES } from '../core/BreathingPattern.js';
import { log } from '../core/Logger.js';

export class AnimationEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
        console.error(`[Prana] Elemento canvas com ID '${canvasId}' não encontrado.`);
        return;
    }
    this.ctx = this.canvas.getContext('2d');
    
    // Estado interno
    this.currentPattern = null;
    this.isRunning = false;
    this.animationFrameId = null;
    this.phaseIndex = 0;
    this.phaseStartTime = 0;
    this.globalAlpha = 1.0;
    
    // Referência ao AudioEngine
    this.audioEngine = null;
    this.lastPhaseIndex = -1;
    
    // Timer para padrões individuais
    this.timerDuration = 0;
    this.timerStartTime = 0;
    this.onTimerComplete = null;

    // Estilo de animação (Ring ou Bordered)
    this.animationStyle = 'Ring'; // Padrão: Ring
    
    // Configurações de animação
    this.config = {
      ring: {
        strokeWidth: 8,
        minDash: 0.05, // 5% do círculo
        maxDash: 1.0,  // 100% do círculo
        radius: 120
      },
      bordered: {
        rings: 3,
        minScale: 0.3,
        maxScale: 1.0,
        strokeWidth: 3,
        spacing: 15
      }
    };

    log("AnimationEngine inicializado.");
  }

  setAudioEngine(audioEngine) {
    this.audioEngine = audioEngine;
  }

  setAnimationStyle(style) {
    if (style === 'Ring' || style === 'Bordered') {
      this.animationStyle = style;
      log(`AnimationEngine: Estilo alterado para ${style}`);
    }
  }

  loadPattern(pattern) {
    this.currentPattern = pattern;
    log(`AnimationEngine: Padrão carregado - ${pattern.name}`);
  }

  setTimer(minutes, onComplete) {
    this.timerDuration = minutes * 60;
    this.onTimerComplete = onComplete;
  }

  start() {
    if (this.isRunning || !this.currentPattern) return;
    this.isRunning = true;
    this.phaseIndex = 0;
    this.phaseStartTime = performance.now();
    this.timerStartTime = performance.now();
    
    if (this.audioEngine) {
      this.audioEngine.playPhaseCue(this.currentPattern.phases[0].type);
      this.lastPhaseIndex = 0;
    }
    
    // Cancela qualquer frame anterior para garantir um início limpo
    if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
    }

    this.animationFrameId = requestAnimationFrame(this._animate.bind(this));
    log("AnimationEngine: Iniciado.");
  }

  stop() {
    this.isRunning = false;
    // O loop de animação vai parar naturalmente na próxima verificação
    // Apenas garantimos que o ID seja limpo
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    // Limpa o canvas ao parar
    setTimeout(() => this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height), 50);
    log("AnimationEngine: Parado.");
  }

  fadeOut(duration = 1.0) {
    this._fade(1.0, 0.0, duration);
  }
  
  fadeIn(duration = 1.0) {
    this._fade(0.0, 1.0, duration);
  }

  _animate(timestamp) {
    // Ponto de saída do loop. Se não estiver rodando, não faz nada.
    if (!this.isRunning) {
        return;
    }

    const currentPhase = this.currentPattern.phases[this.phaseIndex];
    let phaseElapsed = (timestamp - this.phaseStartTime) / 1000;

    // Avança para próxima fase
    if (currentPhase.duration > 0 && phaseElapsed >= currentPhase.duration) {
      this.phaseIndex = (this.phaseIndex + 1) % this.currentPattern.phases.length;
      this.phaseStartTime = timestamp;
      phaseElapsed = 0;
      
      if (this.audioEngine && this.phaseIndex !== this.lastPhaseIndex) {
        const newPhase = this.currentPattern.phases[this.phaseIndex];
        this.audioEngine.playPhaseCue(newPhase.type);
        this.lastPhaseIndex = this.phaseIndex;
      }
    }
    
    // Calcula o progresso da animação baseado no estilo
    const progress = this._calculatePhaseProgress(currentPhase, phaseElapsed);
    
    // Desenha baseado no estilo selecionado
    if (this.animationStyle === 'Ring') {
      this._drawRingAnimation(progress, currentPhase, phaseElapsed);
    } else if (this.animationStyle === 'Bordered') {
      this._drawBorderedAnimation(progress, currentPhase, phaseElapsed);
    }

    // *** OTIMIZAÇÃO PRINCIPAL ***
    // Só agenda o próximo quadro se a animação ainda deve continuar.
    if (this.isRunning) {
        this.animationFrameId = requestAnimationFrame(this._animate.bind(this));
    }
  }
  
  _calculatePhaseProgress(phase, elapsed) {
    if (phase.duration === 0) {
      // Fases instantâneas
      if (phase.type === PHASE_TYPES.INHALE) return 1.0;
      if (phase.type === PHASE_TYPES.EXHALE) return 0.0;
      return 0.5;
    }

    const progress = Math.min(elapsed / phase.duration, 1.0);

    switch (phase.type) {
      case PHASE_TYPES.INHALE:
        return progress; // 0 -> 1
      case PHASE_TYPES.HOLD_IN:
        return 1.0; // Mantém no máximo
      case PHASE_TYPES.EXHALE:
        return 1.0 - progress; // 1 -> 0
      case PHASE_TYPES.HOLD_OUT:
        return 0.0; // Mantém no mínimo
      default:
        return 0.5;
    }
  }

  _drawRingAnimation(progress, currentPhase, phaseElapsed) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.globalAlpha = this.globalAlpha;

    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const radius = Math.min(centerX, centerY) * 0.6;
    
    // Calcula o perímetro do círculo
    const circumference = 2 * Math.PI * radius;
    
    // Calcula quanto do círculo deve ser desenhado
    const dashLength = circumference * (this.config.ring.minDash + 
      (this.config.ring.maxDash - this.config.ring.minDash) * progress);
    
    // Desenha o anel tracejado
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    this.ctx.strokeStyle = this._getPhaseColor(currentPhase.type);
    this.ctx.lineWidth = this.config.ring.strokeWidth;
    this.ctx.lineCap = 'round';
    
    // Configura o dash pattern
    const dashGap = circumference - dashLength;
    this.ctx.setLineDash([dashLength, dashGap]);
    
    // Rotação para começar do topo
    this.ctx.lineDashOffset = -circumference * 0.25;
    
    this.ctx.stroke();
    
    // Desenha o texto central
    this._drawCentralText(currentPhase, phaseElapsed, centerX, centerY);
    
    this.ctx.restore();
  }

  _drawBorderedAnimation(progress, currentPhase, phaseElapsed) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.globalAlpha = this.globalAlpha;

    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const baseRadius = Math.min(centerX, centerY) * 0.4;
    
    // Calcula o fator de escala baseado no progresso
    const scale = this.config.bordered.minScale + 
      (this.config.bordered.maxScale - this.config.bordered.minScale) * progress;
    
    // Desenha os três anéis concêntricos
    const color = this._getPhaseColor(currentPhase.type);
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = this.config.bordered.strokeWidth;
    
    for (let i = 0; i < this.config.bordered.rings; i++) {
      const ringRadius = (baseRadius + i * this.config.bordered.spacing) * scale;
      const alpha = 1.0 - (i * 0.2); // Cada anel mais transparente
      
      this.ctx.save();
      this.ctx.globalAlpha = this.globalAlpha * alpha;
      
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, ringRadius, 0, 2 * Math.PI);
      this.ctx.stroke();
      
      this.ctx.restore();
    }
    
    // Desenha o texto central
    this._drawCentralText(currentPhase, phaseElapsed, centerX, centerY);
    
    this.ctx.restore();
  }

  _drawCentralText(currentPhase, phaseElapsed, centerX, centerY) {
    const phaseName = this._getPhaseName(currentPhase.type);
    const timeRemaining = Math.max(0, Math.ceil(currentPhase.duration - phaseElapsed));
    
    // Configuração do texto
    const fontSize = Math.min(this.canvas.width, this.canvas.height) * 0.08;
    const smallFontSize = fontSize * 0.6;
    
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillStyle = getComputedStyle(document.documentElement)
      .getPropertyValue('--text-primary').trim() || '#333';
    
    // Texto da fase
    this.ctx.font = `bold ${fontSize}px Arial`;
    this.ctx.fillText(phaseName, centerX, centerY - fontSize * 0.3);
    
    // Contagem regressiva (apenas se a duração for maior que 0)
    if (currentPhase.duration > 0) {
      this.ctx.font = `${smallFontSize}px Arial`;
      this.ctx.fillText(timeRemaining.toString(), centerX, centerY + fontSize * 0.3);
    }
    
    // Timer global se configurado
    if (this.timerDuration > 0) {
      const elapsed = (performance.now() - this.timerStartTime) / 1000;
      const remaining = Math.max(0, this.timerDuration - elapsed);
      const minutes = Math.floor(remaining / 60);
      const seconds = Math.floor(remaining % 60);
      
      this.ctx.font = `${smallFontSize * 0.8}px Arial`;
      this.ctx.fillStyle = getComputedStyle(document.documentElement)
        .getPropertyValue('--text-secondary').trim() || '#666';
      this.ctx.fillText(
        `${minutes}:${seconds.toString().padStart(2, '0')}`, 
        centerX, 
        centerY + fontSize * 1.2
      );
      
      if (remaining <= 0 && this.onTimerComplete) {
        this.onTimerComplete();
        this.onTimerComplete = null; 
      }
    }
  }

  _getPhaseColor(phaseType) {
    const colorMap = {
      [PHASE_TYPES.INHALE]: '#4CAF50',   // Verde
      [PHASE_TYPES.HOLD_IN]: '#2196F3',  // Azul
      [PHASE_TYPES.EXHALE]: '#FF9800',   // Laranja
      [PHASE_TYPES.HOLD_OUT]: '#9C27B0'  // Roxo
    };
    
    return colorMap[phaseType] || '#666';
  }
  
  _getPhaseName(phaseType) {
    const names = {
      [PHASE_TYPES.INHALE]: 'In',
      [PHASE_TYPES.HOLD_IN]: 'Hold',
      [PHASE_TYPES.EXHALE]: 'Out',
      [PHASE_TYPES.HOLD_OUT]: 'Hold'
    };
    return names[phaseType] || '';
  }

  _calculateCircleScale(phase, elapsed) {
    // Método legado mantido para compatibilidade
    return this._calculatePhaseProgress(phase, elapsed);
  }

  _fade(start, end, durationSec) {
    const startTime = performance.now();
    const tick = (now) => {
        const elapsed = (now - startTime) / 1000;
        const progress = Math.min(elapsed / durationSec, 1.0);
        this.globalAlpha = start + (end - start) * progress;
        
        if (progress < 1.0) {
            requestAnimationFrame(tick);
        } else {
            this.globalAlpha = end;
        }
    };
    requestAnimationFrame(tick);
  }
}
