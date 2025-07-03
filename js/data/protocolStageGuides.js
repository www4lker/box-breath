// js/data/protocolStageGuides.js
// Textos explicativos concisos para cada estágio dos protocolos

export const protocolStageGuides = {
  
  // P1 - Ignição Progressiva (Ativação Matinal)
  'p1': {
    stages: [
      {
        title: "Limpeza Matinal",
        subtitle: "Melhor Ventilação (4 min)",
        description: "A expiração prolongada elimina CO₂ residual do sono, preparando os quimiorreceptores para maior sensibilidade. Sinta a clareza mental emergindo gradualmente."
      },
      {
        title: "Energia Sustentável", 
        subtitle: "Energia Calma (5 min)",
        description: "Dominância simpática suave ativa neurônios noradrenérgicos do locus coeruleus. Você deve sentir alerta crescente sem ansiedade - energia estável e focada."
      },
      {
        title: "Consolidação",
        subtitle: "Tactical (3 min)", 
        description: "Padrão simétrico estabelece coerência cardíaca que pode persistir por horas. Finalize com estado de alerta calmo pronto para o dia."
      }
    ]
  },

  // P2 - Foco Diamante (Maximização Atencional)
  'p2': {
    stages: [
      {
        title: "Ressonância Cardiovascular",
        subtitle: "Box Plus (6 min)",
        description: "2.5 respirações/minuto criam coerência cardíaca ideal. A simetria facilita entrada em estados de fluxo cognitivo - sua mente se aquieta e foca."
      },
      {
        title: "Otimização Cerebral",
        subtitle: "Customizado Rápido (4 min)",
        description: "Frequência otimizada para demandas cognitivas intensas. Mantém coerência enquanto aumenta fornecimento de O₂ para o cérebro sem perder calma."
      },
      {
        title: "Âncora do Estado",
        subtitle: "Box Plus (2 min)",
        description: "Consolida o estado de foco antes do estudo. Cria 'assinatura neural' que pode ser reativada com algumas respirações durante pausas."
      }
    ]
  },

  // P3 - Portal Vipassana (Preparação para Meditação Longa)
  'p3': {
    stages: [
      {
        title: "Fundação de Calma",
        subtitle: "Sossega Leão (5 min)",
        description: "Acúmulo controlado de CO₂ durante retenção ativa fortemente o nervo vago. Estabelece tranquilidade profunda necessária para investigação sustentada."
      },
      {
        title: "Equilíbrio Refinado",
        subtitle: "Equilibrado (5 min)",
        description: "Retenções moderadas criam prelúdio para suspensão espontânea da respiração. Prepara para os estados de absorção onde a respiração se torna sutil."
      },
      {
        title: "Preparação para Jhanas",
        subtitle: "Endurance Mod (5 min)",
        description: "Expiração duplamente longa treina o sistema para respiração extremamente sutil dos estados meditativos profundos. Facilita dissolução das sensações grosseiras."
      }
    ]
  },

  // P4 - Reset Neural (Recuperação Pós-Esforço Mental)
  'p4': {
    stages: [
      {
        title: "Limpeza Neural",
        subtitle: "Exalação Tripla (4 min)",
        description: "Expiração triplicada cria ondas de ativação vagal que literalmente 'lavam' circuitos neurais sobrecarregados pela atividade mental intensa."
      },
      {
        title: "Normalização Suave",
        subtitle: "Tranquilidade (4 min)",
        description: "Proporção menos extrema mantém relaxamento enquanto normaliza gradualmente os padrões respiratórios. Sinta a tensão mental se dissolvendo."
      },
      {
        title: "Novo Equilíbrio",
        subtitle: "Respiração Natural (2 min)",
        description: "Sistema encontra seu novo ponto de equilíbrio sem imposição de padrões. Mente limpa e renovada, pronta para novos desafios."
      }
    ]
  },

  // P5 - Ignição Metabólica (Preparação para Exercício)
  'p5': {
    stages: [
      {
        title: "Preparação do Sistema Tampão",
        subtitle: "Melhor Ventilação (3 min)",
        description: "Eliminação máxima de CO₂ prepara o sistema tampão para acúmulo durante exercício. Base fisiológica para performance otimizada."
      },
      {
        title: "Alcalose Controlada",
        subtitle: "Wim Hof Mod (30 ciclos)",
        description: "Cria alcalose respiratória que melhora capacidade de tamponamento e aumenta afinidade da hemoglobina pelo O₂. Energia explosiva controlada."
      },
      {
        title: "Estabilização Energética",
        subtitle: "Energia Calma (2 min)",
        description: "Estabiliza em estado de prontidão energética sem hiperventilação excessiva. Corpo preparado, mente focada para o exercício."
      }
    ]
  },

  // P6 - Regeneração Profunda (Recuperação Pós-Exercício)
  'p6': {
    stages: [
      {
        title: "Ativação da Recuperação",
        subtitle: "Sossega Leão (5 min)",
        description: "Retenção prolongada aumenta pressão intratorácica, melhorando retorno venoso e facilitando remoção de metabólitos musculares."
      },
      {
        title: "Estímulo Linfático",
        subtitle: "Dupla Exalação (5 min)",
        description: "Mudanças de pressão ativam fortemente o sistema linfático. Aceleração da limpeza celular e redução da inflamação pós-exercício."
      },
      {
        title: "Consolidação Anabólica",
        subtitle: "Box Plus (5 min)",
        description: "Retorno à simetria consolida estado de recuperação profunda. Ativa processos anabólicos para reparação e crescimento muscular."
      }
    ]
  },

  // P7 - Zona de Fluxo Tático (Gaming Competitivo)
  'p7': {
    stages: [
      {
        title: "Coerência Tática",
        subtitle: "Tactical (4 min)",
        description: "Retenções equilibradas criam coerência cardiovascular que melhora tempo de reação e tomada de decisão. Base da 'vigilância relaxada'."
      },
      {
        title: "Prontidão Otimizada",
        subtitle: "Box Rápido (3 min)",
        description: "Frequência ligeiramente maior aumenta prontidão sem sacrificar estabilidade emocional. Reflexos afiados mantendo controle."
      },
      {
        title: "Estado de Clutch",
        subtitle: "Energia Calma (3 min)",
        description: "Dominância simpática suave garante reflexos ultrarrápidos mantendo calma absoluta. Perfeito para situações de alta pressão."
      }
    ]
  }

};

// Função auxiliar para obter o guia de um estágio específico
export function getStageGuide(protocolId, stageIndex) {
  const protocol = protocolStageGuides[protocolId];
  if (!protocol || !protocol.stages || stageIndex >= protocol.stages.length) {
    return null;
  }
  return protocol.stages[stageIndex];
}

// Função para obter todos os guias de um protocolo
export function getProtocolGuides(protocolId) {
  return protocolStageGuides[protocolId] || null;
}