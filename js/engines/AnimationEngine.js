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
    const maxRadius = Math.min(centerX, centerY) * 0.7; // Reduzido para dar mais espaço
    const minRadius = 40; // Raio mínimo mais definido
    
    // 🎯 CORES MELHORADAS - baseadas nas fases respiratórias
    const phaseColors = {
      'INHALE': { primary: '#4fc3f7', secondary: '#29b6f6', accent: '#03a9f4' },     // Azul inspiração
      'HOLD_IN': { primary: '#ab47bc', secondary: '#8e24aa', accent: '#9c27b0' },   // Roxo retenção cheia
      'EXHALE': { primary: '#66bb6a', secondary: '#4caf50', accent: '#43a047' },    // Verde expiração
      'HOLD_OUT': { primary: '#ff7043', secondary: '#ff5722', accent: '#f4511e' }  // Laranja retenção vazia
    };
    
    const colors = phaseColors[currentPhase.type] || phaseColors['INHALE'];
    
    // 🎯 CÁLCULO DO RAIO com animação suave
    let radiusProgress = progress;
    
    // Easing suave para inspiração e expiração
    if (currentPhase.type === 'INHALE' || currentPhase.type === 'EXHALE') {
      // Easing quadrático para movimento mais natural
      radiusProgress = currentPhase.type === 'INHALE' ? 
        progress * progress : // Ease-in para inspiração
        1 - ((1 - progress) * (1 - progress)); // Ease-out para expiração
    }
    
    const currentRadius = minRadius + (maxRadius - minRadius) * radiusProgress;
    
    // 🎯 EFEITO DE PULSAÇÃO durante retenções
    let pulseEffect = 1.0;
    if (currentPhase.type === 'HOLD_IN' || currentPhase.type === 'HOLD_OUT') {
      const pulseSpeed = 2; // Velocidade da pulsação
      pulseEffect = 1 + Math.sin(phaseElapsed * pulseSpeed) * 0.05; // Pulsação sutil de 5%
    }
    
    const finalRadius = currentRadius * pulseEffect;
    
    // 🎯 CAMADA 1: Aura externa (glow effect)
    this.ctx.save();
    const auraGradient = this.ctx.createRadialGradient(
      centerX, centerY, finalRadius * 0.6,
      centerX, centerY, finalRadius * 1.4
    );
    auraGradient.addColorStop(0, colors.primary + '40'); // 25% opacity
    auraGradient.addColorStop(0.7, colors.secondary + '20'); // 12% opacity
    auraGradient.addColorStop(1, colors.accent + '00'); // Transparente
    
    this.ctx.fillStyle = auraGradient;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, finalRadius * 1.4, 0, 2 * Math.PI);
    this.ctx.fill();
    this.ctx.restore();
    
    // 🎯 CAMADA 2: Círculo principal com gradiente radial
    this.ctx.save();
    const mainGradient = this.ctx.createRadialGradient(
      centerX - finalRadius * 0.3, centerY - finalRadius * 0.3, 0,
      centerX, centerY, finalRadius
    );
    mainGradient.addColorStop(0, colors.primary + 'E6'); // 90% opacity
    mainGradient.addColorStop(0.6, colors.secondary + 'CC'); // 80% opacity
    mainGradient.addColorStop(1, colors.accent + 'B3'); // 70% opacity
    
    // Sombra suave
    this.ctx.shadowColor = colors.primary + '80'; // 50% opacity
    this.ctx.shadowBlur = 15;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 5;
    
    this.ctx.fillStyle = mainGradient;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, finalRadius, 0, 2 * Math.PI);
    this.ctx.fill();
    this.ctx.restore();
    
    // 🎯 CAMADA 3: Contorno elegante
    this.ctx.save();
    this.ctx.strokeStyle = colors.accent;
    this.ctx.lineWidth = 3;
    this.ctx.shadowColor = colors.accent + '60'; // 38% opacity
    this.ctx.shadowBlur = 8;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
    
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, finalRadius, 0, 2 * Math.PI);
    this.ctx.stroke();
    this.ctx.restore();
    
    // 🎯 CAMADA 4: Círculo interno decorativo (durante retenções)
    if (currentPhase.type === 'HOLD_IN' || currentPhase.type === 'HOLD_OUT') {
      this.ctx.save();
      const innerRadius = finalRadius * 0.3;
      const innerGradient = this.ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, innerRadius
      );
      innerGradient.addColorStop(0, colors.primary + 'B3'); // 70% opacity
      innerGradient.addColorStop(1, colors.primary + '40'); // 25% opacity
      
      this.ctx.fillStyle = innerGradient;
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
      this.ctx.fill();
      this.ctx.restore();
    }
    
    // 🎯 TEXTO CENTRAL aprimorado
    this._drawEnhancedCentralText(currentPhase, phaseElapsed, centerX, centerY, colors);
    
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

  _drawEnhancedCentralText(currentPhase, phaseElapsed, centerX, centerY, colors) {
    // Texto aprimorado para animação Legacy
    this.ctx.save();
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.globalAlpha = this.globalAlpha;
    
    // Fundo semi-transparente para melhor legibilidade
    const bgRadius = 60;
    const bgGradient = this.ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, bgRadius
    );
    bgGradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    bgGradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.85)');
    bgGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    this.ctx.fillStyle = bgGradient;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, bgRadius, 0, 2 * Math.PI);
    this.ctx.fill();
    
    // Texto principal da fase com sombra
    this.ctx.save();
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    this.ctx.shadowBlur = 4;
    this.ctx.shadowOffsetX = 1;
    this.ctx.shadowOffsetY = 1;
    
    this.ctx.fillStyle = colors.accent;
    this.ctx.font = 'bold 22px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
    const phaseText = this._getPhaseText(currentPhase.type);
    this.ctx.fillText(phaseText, centerX, centerY - 12);
    this.ctx.restore();
    
    // Contador de tempo (se aplicável)
    if (currentPhase.duration > 0) {
      const remainingTime = Math.max(0, currentPhase.duration - phaseElapsed);
      this.ctx.save();
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      this.ctx.shadowBlur = 2;
      this.ctx.shadowOffsetX = 1;
      this.ctx.shadowOffsetY = 1;
      
      this.ctx.fillStyle = colors.primary;
      this.ctx.font = '16px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
      this.ctx.fillText(`${Math.ceil(remainingTime)}s`, centerX, centerY + 15);
      this.ctx.restore();
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
