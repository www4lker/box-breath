// js/core/Protocol.js
import { BreathingPattern, TRANSITION_TYPES } from './BreathingPattern.js';

/**
 * Classe Protocol
 * Define a estrutura de uma sequência de respiração guiada.
 */
export class Protocol {
  constructor(id, name, stages, metadata = {}) {
    this.id = id;
    this.name = name;
    this.stages = this.validateStages(stages);
    this.metadata = metadata;
    // O ProtocolEngine precisa deste método para calcular o tempo total.
    this.totalDurationMinutes = this.calculateTotalDuration(); 
  }

  validateStages(stages) {
    if (!Array.isArray(stages) || stages.length === 0) {
      throw new Error(`Protocolo "${this.name}" deve ter pelo menos um estágio.`);
    }
    return stages.map(stage => {
      if (!(stage.pattern instanceof BreathingPattern)) {
        console.error("Estágio inválido encontrado no protocolo:", this.name, stage);
        throw new Error('Cada estágio deve conter um objeto BreathingPattern válido.');
      }
      return {
        pattern: stage.pattern,
        durationMinutes: Math.max(Number(stage.durationMinutes) || 1, 1),
        transitionType: stage.transitionType || TRANSITION_TYPES.SMOOTH
      };
    });
  }

  /**
   * Calcula a duração total do protocolo em minutos.
   * Este método é essencial para a barra de progresso e o timer.
   */
  calculateTotalDuration() {
    return this.stages.reduce((total, stage) => total + stage.durationMinutes, 0);
  }

  getSummary() {
    let summary = `Protocolo: ${this.name}\nDuração: ${this.totalDurationMinutes} min\nEstágios:\n`;
    this.stages.forEach((stage, i) => {
      summary += `  ${i + 1}. ${stage.pattern.name} - ${stage.durationMinutes} min\n`;
    });
    return summary;
  }
}