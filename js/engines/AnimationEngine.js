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

    // Estilo de animação (Ring, Bordered, Box ou Legacy)
    this.animationStyle = 'Ring'; // Padrão: Ring
    
    // Configurações de animação
    this.config = {
      ring: {
        strokeWidth: 6,
        minDash: 0.05, // 5% do círculo
        maxDash: 1.0,  // 100% do círculo
        radius: 120
      },
      bordered: {
        rings: 3,
        minScale: 0.3,
        maxScale: 1.0,
        strokeWidth: 2,
        spacing: 12
      },
      box: {
        size: 160,        // Tamanho da caixa
        ballRadius: 8,    // Raio da bolinha
        strokeWidth: 3,   // Espessura da linha da caixa
        cornerRadius: 10  // Raio dos cantos arredondados
      },
      legacy: {
        maxRadius: 120,   // Raio máximo do círculo externo
        minRadius: 36,    // Raio mínimo do círculo interno
        strokeWidth: 2,   // Espessura da linha do contorno
        ballMinScale: 0.85, // Escala mínima da bolinha (expiração)
        ballMaxScale: 1.15  // Escala máxima da bolinha (inspiração)
      }
    };

    log("AnimationEngine inicializado.");
  }

  setAudioEngine(audioEngine) {
    this.audioEngine = audioEngine;
  }

  setAnimationStyle(style) {
    if (style === 'Ring' || style === 'Bordered' || style === 'Box' || style === 'Legacy') {
      this.animationStyle = style;
      log(`AnimationEngine: Estilo alterado para ${style}`);
    }
  }

  loadPattern(pattern) {
    this.currentPattern = pattern;
    
    // Detecta automaticamente se é Box Breathing
    if (pattern.name === 'Box Plus' && this._isBoxBreathingPattern(pattern)) {
      this.setAnimationStyle('Legacy');
      log(`AnimationEngine: Box Breathing detectado - mudando para estilo Legacy`);
    }
    
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
    } else if (this.animationStyle === 'Box') {
      this._drawBoxAnimation(progress, currentPhase, phaseElapsed);
    } else if (this.animationStyle === 'Legacy') {
      this._drawLegacyAnimation(progress, currentPhase, phaseElapsed);
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
    
    // Estilo mais limpo - gradiente sutil
    const gradient = this.ctx.createLinearGradient(
      centerX - radius, centerY - radius,
      centerX + radius, centerY + radius
    );
    const baseColor = this._getPhaseColor(currentPhase.type);
    gradient.addColorStop(0, baseColor);
    gradient.addColorStop(0.5, this._lightenColor(baseColor, 0.2));
    gradient.addColorStop(1, baseColor);
    
    // Sombra mais sutil
    this.ctx.save();
    this.ctx.shadowColor = baseColor;
    this.ctx.shadowBlur = 10;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
    
    // Desenha o anel tracejado
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    this.ctx.strokeStyle = gradient;
    this.ctx.lineWidth = this.config.ring.strokeWidth;
    this.ctx.lineCap = 'round';
    
    // Configura o dash pattern
    const dashGap = Math.max(circumference - dashLength, 0);
    this.ctx.setLineDash([dashLength, dashGap]);
    this.ctx.lineDashOffset = -circumference * 0.25;
    
    this.ctx.stroke();
    this.ctx.restore();
    
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
    const baseRadius = Math.min(centerX, centerY) * 0.25;
    
    // Calcula o fator de escala baseado no progresso
    const scale = this.config.bordered.minScale + 
      (this.config.bordered.maxScale - this.config.bordered.minScale) * progress;
    
    // Desenha os três anéis concêntricos - estilo mais limpo
    const baseColor = this._getPhaseColor(currentPhase.type);
    
    for (let i = 0; i < this.config.bordered.rings; i++) {
      const ringRadius = (baseRadius + i * this.config.bordered.spacing) * scale;
      const alpha = 1.0 - (i * 0.25); // Cada anel mais transparente
      
      this.ctx.save();
      this.ctx.globalAlpha = this.globalAlpha * alpha;
      this.ctx.strokeStyle = baseColor;
      this.ctx.lineWidth = this.config.bordered.strokeWidth;
      
      // Sombra mais sutil
      this.ctx.shadowColor = baseColor;
      this.ctx.shadowBlur = 6;
      this.ctx.shadowOffsetX = 0;
      this.ctx.shadowOffsetY = 0;
      
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, ringRadius, 0, 2 * Math.PI);
      this.ctx.stroke();
      
      this.ctx.restore();
    }
    
    // Desenha o texto central
    this._drawCentralText(currentPhase, phaseElapsed, centerX, centerY);
    
    this.ctx.restore();
  }

  _drawBoxAnimation(progress, currentPhase, phaseElapsed) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.globalAlpha = this.globalAlpha;

    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const boxSize = this.config.box.size;
    const halfSize = boxSize / 2;
    
    // Coordenadas da caixa
    const left = centerX - halfSize;
    const right = centerX + halfSize;
    const top = centerY - halfSize;
    const bottom = centerY + halfSize;
    
    // Desenha a caixa com cantos arredondados
    const baseColor = this._getPhaseColor(currentPhase.type);
    this.ctx.strokeStyle = baseColor;
    this.ctx.lineWidth = this.config.box.strokeWidth;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    // Sombra sutil
    this.ctx.shadowColor = baseColor;
    this.ctx.shadowBlur = 8;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
    
    this.ctx.beginPath();
    this._roundRect(this.ctx, left, top, boxSize, boxSize, this.config.box.cornerRadius);
    this.ctx.stroke();
    
    // Calcula a posição da bolinha baseada na fase e progresso
    const ballPosition = this._calculateBallPosition(currentPhase, progress, left, right, top, bottom);
    
    // Desenha a bolinha
    this.ctx.save();
    this.ctx.fillStyle = baseColor;
    this.ctx.shadowColor = baseColor;
    this.ctx.shadowBlur = 12;
    
    this.ctx.beginPath();
    this.ctx.arc(ballPosition.x, ballPosition.y, this.config.box.ballRadius, 0, 2 * Math.PI);
    this.ctx.fill();
    this.ctx.restore();
    
    // Desenha o texto central
    this._drawCentralText(currentPhase, phaseElapsed, centerX, centerY);
    
    this.ctx.restore();
  }

  _drawLegacyAnimation(progress, currentPhase, phaseElapsed) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.globalAlpha = this.globalAlpha;

    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const maxRadius = Math.min(centerX, centerY) * 0.8;
    const minRadius = maxRadius * 0.3;
    
    // Círculo externo (contorno da "caixa")
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, maxRadius, 0, 2 * Math.PI);
    this.ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim();
    this.ctx.lineWidth = this.config.legacy.strokeWidth;
    this.ctx.stroke();
    
    // Círculo interno (a "bolinha" que se move)
    const currentRadius = minRadius + (maxRadius - minRadius) * (progress * 0.3);
    const phaseType = currentPhase.type.toLowerCase();
    const colorVar = `--color-${phaseType}`;
    const color = getComputedStyle(document.documentElement).getPropertyValue(colorVar).trim();
    
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, currentRadius, 0, 2 * Math.PI);
    this.ctx.fillStyle = color;
    this.ctx.fill();
    
    // Desenha o texto central
    this._drawCentralText(currentPhase, phaseElapsed, centerX, centerY);
    
    this.ctx.restore();
  }

  _calculateBallPosition(phase, progress, left, right, top, bottom) {
    // Para box breathing, a bolinha percorre o perímetro da caixa
    // Cada lado representa uma fase da respiração
    
    const PHASE_TYPES = {
      INHALE: 'INHALE',
      HOLD_IN: 'HOLD_IN', 
      EXHALE: 'EXHALE',
      HOLD_OUT: 'HOLD_OUT'
    };
    
    switch (phase.type) {
      case PHASE_TYPES.INHALE:
        // Lado inferior: da esquerda para direita
        return {
          x: left + (right - left) * progress,
          y: bottom
        };
        
      case PHASE_TYPES.HOLD_IN:
        // Lado direito: de baixo para cima
        return {
          x: right,
          y: bottom - (bottom - top) * progress
        };
        
      case PHASE_TYPES.EXHALE:
        // Lado superior: da direita para esquerda
        return {
          x: right - (right - left) * progress,
          y: top
        };
        
      case PHASE_TYPES.HOLD_OUT:
        // Lado esquerdo: de cima para baixo
        return {
          x: left,
          y: top + (bottom - top) * progress
        };
        
      default:
        return { x: left, y: bottom };
    }
  }

  _isBoxBreathingPattern(pattern) {
    // Verifica se o padrão tem 4 fases com durações iguais (característica do Box Breathing)
    if (!pattern.phases || pattern.phases.length !== 4) {
      return false;
    }
    
    const phases = pattern.phases;
    const firstDuration = phases[0].duration;
    
    // Verifica se todas as durações são iguais
    const allEqual = phases.every(phase => phase.duration === firstDuration);
    
    // Verifica se tem todas as 4 fases do box breathing
    const hasInhale = phases.some(p => p.type === 'INHALE');
    const hasHoldIn = phases.some(p => p.type === 'HOLD_IN');
    const hasExhale = phases.some(p => p.type === 'EXHALE');
    const hasHoldOut = phases.some(p => p.type === 'HOLD_OUT');
    
    return allEqual && hasInhale && hasHoldIn && hasExhale && hasHoldOut;
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

  _roundRect(ctx, x, y, width, height, radius) {
    // Método auxiliar para desenhar retângulo com cantos arredondados
    // Compatível com navegadores mais antigos
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(x, y, width, height, radius);
    } else {
      // Implementação manual para compatibilidade
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
    }
  }

  _getPhaseColor(phaseType) {
    const phaseTypeStr = phaseType.toLowerCase().replace('_', '-');
    const colorVar = `--color-${phaseTypeStr}`;
    return getComputedStyle(document.documentElement).getPropertyValue(colorVar).trim();
  }

  _lightenColor(color, factor) {
    // Método auxiliar para clarear uma cor
    // Implementação simples para gradientes
    if (color.startsWith('rgb')) {
      const matches = color.match(/\d+/g);
      if (matches && matches.length >= 3) {
        const r = Math.min(255, parseInt(matches[0]) + Math.floor(255 * factor));
        const g = Math.min(255, parseInt(matches[1]) + Math.floor(255 * factor));
        const b = Math.min(255, parseInt(matches[2]) + Math.floor(255 * factor));
        return `rgb(${r}, ${g}, ${b})`;
      }
    }
    return color;
  }

  _drawCentralText(currentPhase, phaseElapsed, centerX, centerY) {
    // Configuração do texto
    this.ctx.save();
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.globalAlpha = this.globalAlpha;
    
    // Cor do texto baseada na fase
    const textColor = this._getPhaseColor(currentPhase.type);
    this.ctx.fillStyle = textColor;
    
    // Texto principal da fase
    this.ctx.font = 'bold 18px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
    const phaseText = this._getPhaseText(currentPhase.type);
    this.ctx.fillText(phaseText, centerX, centerY - 15);
    
    // Contador de tempo (se aplicável)
    if (currentPhase.duration > 0) {
      const remainingTime = Math.max(0, currentPhase.duration - phaseElapsed);
      this.ctx.font = '14px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
      this.ctx.fillText(`${Math.ceil(remainingTime)}s`, centerX, centerY + 15);
    }
    
    this.ctx.restore();
  }

  _getPhaseText(phaseType) {
    switch (phaseType) {
      case 'INHALE':
        return 'Inspire';
      case 'HOLD_IN':
        return 'Segure';
      case 'EXHALE':
        return 'Expire';
      case 'HOLD_OUT':
        return 'Pausa';
      default:
        return 'Respire';
    }
  }
}
