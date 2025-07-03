// js/data/protocols.js
import { Protocol } from '../core/Protocol.js';
import { patternsById } from './patterns.js';

// Função auxiliar para encontrar padrões pelo nome (ID gerado)
const getPattern = (name) => {
    const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const pattern = patternsById[id];
    if (!pattern) {
        // Este log de erro nos ajuda a encontrar problemas de digitação nos nomes dos padrões
        console.error(`Padrão não encontrado ao criar protocolos: "${name}" (ID buscado: ${id})`);
    }
    return pattern;
};

// Definição completa dos 7 protocolos
export const protocols = [
    new Protocol('p1', 'Ignição Progressiva', [
        { pattern: getPattern('Melhor Ventilação'), durationMinutes: 4 },
        { pattern: getPattern('Energia Calma'), durationMinutes: 5 },
        { pattern: getPattern('Tactical'), durationMinutes: 3 }
    ], { purpose: 'Ativação matinal gradual', difficulty: 2, tags: ['manhã', 'energia', 'foco'] }),

    new Protocol('p2', 'Foco Diamante', [
        { pattern: getPattern('Tactical'), durationMinutes: 5 },
        { pattern: getPattern('Box Plus'), durationMinutes: 7 }
    ], { purpose: 'Clareza mental e concentração', difficulty: 3, tags: ['foco', 'trabalho', 'estudo'] }),

    new Protocol('p3', 'Portal Vipassana', [
        { pattern: getPattern('Sossega Leão'), durationMinutes: 5 },
        { pattern: getPattern('Box Plus'), durationMinutes: 5 },
        { pattern: getPattern('Endurance'), durationMinutes: 5 }
    ], { purpose: 'Preparação para meditação profunda', difficulty: 4, tags: ['meditação', 'vipassana', 'calma'] }),

    new Protocol('p4', 'Reset Neural', [
        { pattern: getPattern('Calma'), durationMinutes: 4 },
        { pattern: getPattern('Tranquilidade'), durationMinutes: 6 }
    ], { purpose: 'Desligar o sistema nervoso após estresse', difficulty: 1, tags: ['relaxamento', 'noite', 'ansiedade'] }),

    new Protocol('p5', 'Ignição Metabólica', [
        { pattern: getPattern('Energia Calma'), durationMinutes: 3 },
        { pattern: getPattern('Endurance'), durationMinutes: 5 }
    ], { purpose: 'Ativação para atividade física', difficulty: 4, tags: ['performance', 'esporte', 'energia'] }),
    
    new Protocol('p6', 'Regeneração Profunda', [
        { pattern: getPattern('Sossega Leão'), durationMinutes: 7 },
        { pattern: getPattern('Tranquilidade'), durationMinutes: 8 }
    ], { purpose: 'Indução ao sono e recuperação', difficulty: 2, tags: ['sono', 'relaxamento', 'noite'] }),

    new Protocol('p7', 'Zona de Fluxo Tático', [
        { pattern: getPattern('Melhor Ventilação'), durationMinutes: 3 },
        { pattern: getPattern('Box Plus'), durationMinutes: 7 }
    ], { purpose: 'Estado de alerta calmo para performance mental', difficulty: 3, tags: ['fluxo', 'performance', 'foco'] })
];