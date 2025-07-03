// js/core/BreathingPattern.js

/**
 * Sistema Avançado de Gerenciamento de Padrões Respiratórios
 * Este módulo implementa a lógica para criar e validar padrões e protocolos.
 */

// ===== CONSTANTES E ENUMERAÇÕES =====

export const PHASE_TYPES = {
  INHALE: 'INHALE',
  HOLD_IN: 'HOLD_IN',
  EXHALE: 'EXHALE',
  HOLD_OUT: 'HOLD_OUT'
};

export const PATTERN_CATEGORIES = {
  RELAXATION: 'relaxamento',
  ENERGIZATION: 'energização',
  BALANCE: 'equilíbrio',
  MEDITATION: 'meditação',
  PERFORMANCE: 'performance'
};

export const TRANSITION_TYPES = {
  SMOOTH: 'smooth',
  ABRUPT: 'abrupt',
  GUIDED: 'guided',
  BRIDGE: 'bridge'
};

// ===== CLASSE BASE: BREATHING PATTERN =====
export class BreathingPattern {
  constructor(name, phases, metadata = {}) {
    this.id = this.generateId(name);
    this.name = name;
    this.phases = this.validatePhases(phases);
    this.metadata = this.validateMetadata(metadata);
    this.cycleDuration = this.calculateCycleDuration();
    this.breathsPerMinute = this.calculateBreathsPerMinute();
    this.ratios = this.calculateRatios();
  }

  generateId(name) {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  validatePhases(phases) {
    if (!Array.isArray(phases) || phases.length === 0) {
      throw new Error('Padrão deve ter pelo menos uma fase');
    }
    const hasInhale = phases.some(p => p.type === PHASE_TYPES.INHALE);
    const hasExhale = phases.some(p => p.type === PHASE_TYPES.EXHALE);
    if (!hasInhale || !hasExhale) {
      throw new Error('Padrão deve incluir pelo menos inspiração e expiração');
    }
    return phases.map((phase, index) => {
      const duration = Number(phase.duration);
      if (duration < 0) throw new Error(`Duração inválida no índice ${index}: ${duration}`);
      return {
        type: phase.type,
        duration: duration,
        audioTone: phase.audioTone || 0, // Garante que a propriedade exista
        instruction: phase.instruction || this.getDefaultInstruction(phase.type)
      };
    });
  }

  getDefaultInstruction(phaseType) {
    const instructions = {
      [PHASE_TYPES.INHALE]: 'Inspire',
      [PHASE_TYPES.HOLD_IN]: 'Segure',
      [PHASE_TYPES.EXHALE]: 'Expire',
      [PHASE_TYPES.HOLD_OUT]: 'Mantenha vazio'
    };
    return instructions[phaseType] || '';
  }

  validateMetadata(metadata) {
    return {
      category: metadata.category || PATTERN_CATEGORIES.BALANCE,
      effects: Array.isArray(metadata.effects) ? metadata.effects : [],
      difficulty: Math.min(Math.max(Number(metadata.difficulty) || 1, 1), 5),
      contraindicações: metadata.contraindicações || [],
      evidenceLevel: metadata.evidenceLevel || 'empirical',
      bestTimeOfDay: metadata.bestTimeOfDay || 'any'
    };
  }

  calculateCycleDuration() {
    return this.phases.reduce((total, phase) => total + (phase.duration || 0), 0);
  }

  calculateBreathsPerMinute() {
    if (this.cycleDuration === 0) return 0;
    return (60 / this.cycleDuration).toFixed(2);
  }

  calculateRatios() {
    const inhale = this.phases.find(p => p.type === PHASE_TYPES.INHALE)?.duration || 0;
    const exhale = this.phases.find(p => p.type === PHASE_TYPES.EXHALE)?.duration || 0;
    const totalDuration = this.cycleDuration;
    if (totalDuration === 0) return { inhaleToExhale: 0, activeToTotal: 0, retentionRatio: 0 };
    return {
      inhaleToExhale: exhale > 0 ? (inhale / exhale).toFixed(2) : 0,
      activeToTotal: ((inhale + exhale) / totalDuration).toFixed(2),
      retentionRatio: (1 - (inhale + exhale) / totalDuration).toFixed(2)
    };
  }

  getCompactNotation() {
    return this.phases.map(p => p.duration).join('-');
  }

  getDescription() {
    return `${this.name} (${this.getCompactNotation()}) - ${this.breathsPerMinute} RPM`;
  }
}

// ===== CLASSE AVANÇADA: PROTOCOL =====
// Esta classe também estava neste arquivo, a manteremos aqui por enquanto.
export class Protocol {
  constructor(id, name, stages, metadata = {}) {
    this.id = id;
    this.name = name;
    this.stages = this.validateStages(stages);
    this.metadata = metadata;
    this.totalDuration = this.calculateTotalDuration();
  }

  validateStages(stages) {
    if (!Array.isArray(stages) || stages.length === 0) {
      throw new Error('Protocolo deve ter pelo menos um estágio');
    }
    return stages.map(stage => {
      if (!(stage.pattern instanceof BreathingPattern)) {
        throw new Error('Estágio deve conter um objeto BreathingPattern válido');
      }
      return {
        pattern: stage.pattern,
        durationMinutes: Math.max(Number(stage.durationMinutes) || 1, 1),
        transitionType: stage.transitionType || TRANSITION_TYPES.SMOOTH
      };
    });
  }

  calculateTotalDuration() {
    return this.stages.reduce((total, stage) => total + stage.durationMinutes, 0);
  }

  getSummary() {
    let summary = `Protocolo: ${this.name}\nDuração: ${this.totalDuration} min\nEstágios:\n`;
    this.stages.forEach((stage, i) => {
      summary += `  ${i + 1}. ${stage.pattern.name} - ${stage.durationMinutes} min\n`;
    });
    return summary;
  }
}

// NOTA: Os padrões e a "PatternFactory" que estavam aqui foram removidos, 
// pois agora centralizamos tudo em `js/data/patterns.js`.