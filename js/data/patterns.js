// js/data/patterns.js
import { BreathingPattern, PHASE_TYPES } from '../core/BreathingPattern.js';

export { PHASE_TYPES };

// Lista completa e unificada de todos os padrões respiratórios
export const patterns = [
  new BreathingPattern('Sossega Leão', [
    { type: PHASE_TYPES.INHALE, duration: 4 },
    { type: PHASE_TYPES.HOLD_IN, duration: 7 },
    { type: PHASE_TYPES.EXHALE, duration: 8 },
  ], { category: 'relaxamento', effects: ['redução de ansiedade'], difficulty: 2, evidenceLevel: 'clinical' }),
  
  new BreathingPattern('Box Plus', [
    { type: PHASE_TYPES.INHALE, duration: 6 },
    { type: PHASE_TYPES.HOLD_IN, duration: 6 },
    { type: PHASE_TYPES.EXHALE, duration: 6 },
    { type: PHASE_TYPES.HOLD_OUT, duration: 6 }
  ], { category: 'equilíbrio', effects: ['foco', 'coerência cardíaca'], difficulty: 3 }),

  new BreathingPattern('Energia Calma', [
    { type: PHASE_TYPES.INHALE, duration: 5 },
    { type: PHASE_TYPES.EXHALE, duration: 2 },
  ], { category: 'energização', effects: ['foco', 'energia sustentável'], difficulty: 1 }),

  new BreathingPattern('Calma', [
    { type: PHASE_TYPES.INHALE, duration: 4 },
    { type: PHASE_TYPES.EXHALE, duration: 6 },
  ], { category: 'relaxamento', effects: ['relaxamento suave'], difficulty: 1 }),
  
  new BreathingPattern('Endurance', [
    { type: PHASE_TYPES.INHALE, duration: 5 },
    { type: PHASE_TYPES.EXHALE, duration: 8 },
    { type: PHASE_TYPES.HOLD_OUT, duration: 5 }
  ], { category: 'performance', effects: ['tolerância ao CO2'], difficulty: 4, contraindicações: ['hipertensão'] }),

  new BreathingPattern('Melhor Ventilação', [
    { type: PHASE_TYPES.INHALE, duration: 3 },
    { type: PHASE_TYPES.EXHALE, duration: 8 },
    { type: PHASE_TYPES.HOLD_OUT, duration: 1.8 }
  ], { category: 'equilíbrio', effects: ['limpeza de CO2'], difficulty: 2 }),

  new BreathingPattern('Tranquilidade', [
    { type: PHASE_TYPES.INHALE, duration: 3 },
    { type: PHASE_TYPES.EXHALE, duration: 6 },
  ], { category: 'relaxamento', effects: ['paz mental'], difficulty: 1 }),

  new BreathingPattern('Tactical', [
    { type: PHASE_TYPES.INHALE, duration: 5.5 },
    { type: PHASE_TYPES.HOLD_IN, duration: 5.5 },
    { type: PHASE_TYPES.EXHALE, duration: 5.5 },
  ], { category: 'performance', effects: ['alerta calmo'], difficulty: 3 })
];

// Mapeia os padrões por ID para fácil acesso
export const patternsById = patterns.reduce((map, pattern) => {
    map[pattern.id] = pattern;
    return map;
}, {});