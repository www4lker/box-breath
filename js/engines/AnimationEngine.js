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
    // Associação automática: Box Plus permite Box, mas não força seleção
    if (pattern.name !== 'Box Plus' && this.animationStyle === 'Box') {
      // Se não for Box Plus, e o usuário estava com Box, força para Ring
      this.setAnimationStyle('Ring');
      log('AnimationEngine: Animação Box desativada para padrões assimétricos. Mudando para Ring.');
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

    // Tamanho do quadrado responsivo ao canvas
    const minDim = Math.min(this.canvas.width, this.canvas.height);
    const boxSize = Math.max(minDim * 0.55, 120); // 55% do menor lado, mínimo 120px
    const halfSize = boxSize / 2;
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const left = centerX - halfSize;
    const right = centerX + halfSize;
    const top = centerY - halfSize;
    const bottom = centerY + halfSize;

    // Configurações para renderização suave
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.imageSmoothingEnabled = true;

    // Desenha a caixa com cantos arredondados
    const baseColor = this._getPhaseColor(currentPhase.type);
    this.ctx.strokeStyle = baseColor;
    this.ctx.lineWidth = this.config.box.strokeWidth;
    this.ctx.shadowColor = baseColor;
    this.ctx.shadowBlur = 10;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
    this.ctx.beginPath();
    this._roundRect(this.ctx, left, top, boxSize, boxSize, this.config.box.cornerRadius);
    this.ctx.stroke();

    // Calcula posição da bolinha ao longo do perímetro (movimento contínuo)
    const globalProgress = this._calculateGlobalBoxProgress(phaseElapsed);
    const ballPosition = this._calculateBoxBallPositionGlobal(globalProgress, left, right, top, bottom);

    // Desenha sombra da bolinha (para profundidade visual)
    this.ctx.save();
    this.ctx.globalAlpha = this.globalAlpha * 0.3;
    this.ctx.fillStyle = baseColor;
    this.ctx.shadowColor = 'rgba(0,0,0,0.2)';
    this.ctx.shadowBlur = 6;
    this.ctx.shadowOffsetX = 2;
    this.ctx.shadowOffsetY = 2;
    this.ctx.beginPath();
    this.ctx.arc(ballPosition.x + 1, ballPosition.y + 1, this.config.box.ballRadius * 0.8, 0, 2 * Math.PI);
    this.ctx.fill();
    this.ctx.restore();

    // Desenha a bolinha principal
    this.ctx.save();
    this.ctx.fillStyle = baseColor;
    this.ctx.shadowColor = baseColor;
    this.ctx.shadowBlur = 15;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
    this.ctx.beginPath();
    this.ctx.arc(ballPosition.x, ballPosition.y, this.config.box.ballRadius, 0, 2 * Math.PI);
    this.ctx.fill();
    // Adiciona highlight na bolinha para efeito 3D
    this.ctx.globalAlpha = 0.6;
    this.ctx.fillStyle = this._lightenColor(baseColor, 0.3);
    this.ctx.shadowBlur = 0;
    this.ctx.beginPath();
    this.ctx.arc(
      ballPosition.x - this.config.box.ballRadius * 0.3, 
      ballPosition.y - this.config.box.ballRadius * 0.3, 
      this.config.box.ballRadius * 0.4, 
      0, 2 * Math.PI
    );
    this.ctx.fill();
    this.ctx.restore();

    // Desenha o texto central
    this._drawCentralText(currentPhase, phaseElapsed, centerX, centerY);
    this.ctx.restore();
  }

  // Novo: calcula a posição da bolinha ao longo do perímetro do quadrado, sincronizado com o ciclo global
  _calculateBoxBallPositionGlobal(globalProgress, left, right, top, bottom) {
    // Calcula o comprimento de cada lado proporcional à duração das fases
    if (!this.currentPattern) {
      return { x: left, y: bottom };
    }
    const phases = this.currentPattern.phases;
    const durations = phases.map(p => p.duration);
    const totalDuration = durations.reduce((a, b) => a + b, 0);
    // Lados: INHALE (baixo), HOLD_IN (direita), EXHALE (cima), HOLD_OUT (esquerda)
    const sides = [
      { from: { x: left, y: bottom }, to: { x: right, y: bottom } }, // INHALE
      { from: { x: right, y: bottom }, to: { x: right, y: top } },   // HOLD_IN
      { from: { x: right, y: top }, to: { x: left, y: top } },       // EXHALE
      { from: { x: left, y: top }, to: { x: left, y: bottom } }      // HOLD_OUT
    ];
    // Calcula os pontos de corte ao longo do ciclo
    let acc = 0;
    const cuts = durations.map(d => {
      const start = acc / totalDuration;
      acc += d;
      return start;
    });
    cuts.push(1); // Fim do ciclo
    // Descobre em qual lado está o progresso global
    let sideIdx = 0;
    for (let i = 0; i < 4; i++) {
      if (globalProgress >= cuts[i] && globalProgress < cuts[i + 1]) {
        sideIdx = i;
        break;
      }
    }
    // Progresso local no lado
    const localProgress = (globalProgress - cuts[sideIdx]) / (cuts[sideIdx + 1] - cuts[sideIdx]);
    // Interpola ao longo do lado
    const from = sides[sideIdx].from;
    const to = sides[sideIdx].to;
    // Suaviza a curva nos cantos
    const cornerRadius = this.config.box.cornerRadius || 12;
    const offset = cornerRadius * 0.6;
    // Cria cópias ajustadas dos pontos, sem modificar os originais
    let fx = from.x, fy = from.y, tx = to.x, ty = to.y;
    if (sideIdx === 0) { fx = from.x + offset; tx = to.x - offset; }
    if (sideIdx === 1) { fy = from.y - offset; ty = to.y + offset; }
    if (sideIdx === 2) { fx = from.x - offset; tx = to.x + offset; }
    if (sideIdx === 3) { fy = from.y + offset; ty = to.y - offset; }
    // Interpolação linear
    return {
      x: fx + (tx - fx) * localProgress,
      y: fy + (ty - fy) * localProgress
    };
  }

  // Calcula o progresso global ao longo do ciclo box (0 a 1)
  _calculateGlobalBoxProgress(phaseElapsed) {
    if (!this.currentPattern) return 0;
    const phases = this.currentPattern.phases;
    let totalDuration = 0;
    for (const p of phases) totalDuration += p.duration;
    // Descobre o tempo decorrido desde o início do ciclo
    let elapsed = 0;
    for (let i = 0; i < this.phaseIndex; i++) {
      elapsed += phases[i].duration;
    }
    elapsed += phaseElapsed;
    return (elapsed / totalDuration) % 1;
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
    // Método melhorado para clarear uma cor
    if (color.startsWith('rgb(')) {
      const matches = color.match(/\d+/g);
      if (matches && matches.length >= 3) {
        const r = Math.min(255, parseInt(matches[0]) + Math.floor(255 * factor));
        const g = Math.min(255, parseInt(matches[1]) + Math.floor(255 * factor));
        const b = Math.min(255, parseInt(matches[2]) + Math.floor(255 * factor));
        return `rgb(${r}, ${g}, ${b})`;
      }
    } else if (color.startsWith('#')) {
      // Suporte para cores hexadecimais
      const hex = color.slice(1);
      const r = Math.min(255, parseInt(hex.slice(0, 2), 16) + Math.floor(255 * factor));
      const g = Math.min(255, parseInt(hex.slice(2, 4), 16) + Math.floor(255 * factor));
      const b = Math.min(255, parseInt(hex.slice(4, 6), 16) + Math.floor(255 * factor));
      return `rgb(${r}, ${g}, ${b})`;
    }
    // Fallback: retorna a cor original se não conseguir processar
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

  // Garante que apenas o padrão Box Plus ativa o estilo Box
  _isBoxBreathingPattern(pattern) {
    // Considera o nome, mas pode ser expandido para lógica mais robusta
    return pattern && pattern.name === 'Box Plus';
  }

  _drawLegacyAnimation(progress, currentPhase, phaseElapsed) {
    // Animação Legacy: círculo pulsante simples (placeholder)
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.globalAlpha = this.globalAlpha;
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const minR = this.config.legacy.minRadius;
    const maxR = this.config.legacy.maxRadius;
    const baseColor = this._getPhaseColor(currentPhase.type);
    // Raio pulsante
    const radius = minR + (maxR - minR) * progress;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    this.ctx.strokeStyle = baseColor;
    this.ctx.lineWidth = this.config.legacy.strokeWidth;
    this.ctx.shadowColor = baseColor;
    this.ctx.shadowBlur = 8;
    this.ctx.stroke();
    // Bolinha central
    const ballScale = this.config.legacy.ballMinScale + (this.config.legacy.ballMaxScale - this.config.legacy.ballMinScale) * progress;
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, 18 * ballScale, 0, 2 * Math.PI);
    this.ctx.fillStyle = baseColor;
    this.ctx.shadowColor = baseColor;
    this.ctx.shadowBlur = 12;
    this.ctx.fill();
    this.ctx.restore();
    // Texto central
    this._drawCentralText(currentPhase, phaseElapsed, centerX, centerY);
    this.ctx.restore();
  }
}
