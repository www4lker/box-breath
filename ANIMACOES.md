# Animações Prana Hub - Versão Completa

## Quatro Estilos de Animação Implementados

O aplicativo agora oferece quatro estilos visuais distintos para guiar os exercícios de respiração:

#### **Estilo "Ring" (Anel) - Versão Limpa**
- **Conceito**: Um anel tracejado que se desenha progressivamente de forma suave
- **Uso**: Ideal para qualquer padrão de respiração
- **Características Visuais**:
  - Gradiente sutil para elegância
  - Sombra suave (blur 10px)
  - Linha fina (strokeWidth 6px)
  - Rotação simplificada sempre começando do topo

#### **Estilo "Bordered" (Bordas) - Versão Limpa**
- **Conceito**: Três anéis concêntricos com movimento suave e elegante
- **Uso**: Ideal para meditação e práticas contemplativas
- **Características Visuais**:
  - Raio base otimizado
  - Linhas finas (strokeWidth 2px)
  - Espaçamento harmonioso (12px)
  - Sombra sutil (blur 6px)

#### **Estilo "Box" (Caixa)**
- **Conceito**: Bolinha que percorre o perímetro de uma caixa quadrada
- **Uso**: Disponível para seleção manual
- **Comportamento**:
  - **Inspirar**: Bolinha percorre o lado inferior (esquerda → direita)
  - **Segurar (Cheio)**: Bolinha sobe pelo lado direito (baixo → cima)
  - **Expirar**: Bolinha percorre o lado superior (direita → esquerda)
  - **Segurar (Vazio)**: Bolinha desce pelo lado esquerdo (cima → baixo)

#### **Estilo "Legacy" (Legado) - EXCLUSIVO** ✨
- **Conceito**: Animação clássica com círculo externo fixo e círculo interno que se expande/contrai
- **Uso**: **Ativado automaticamente para padrões Box Breathing**
- **Detecção Automática**: Identifica padrões com 4 fases de durações iguais
- **Características Visuais**:
  - Círculo externo fixo (contorno da "caixa")
  - Círculo interno que se expande e contrai suavemente
  - Cores dinâmicas baseadas na fase atual
  - Texto central com contador regressivo
  - Inspirado na animação clássica de exercícios de respiração

### 2. Configurações Completas

As configurações foram otimizadas para quatro estilos distintos:

```javascript
this.config = {
  ring: {
    strokeWidth: 6,
    minDash: 0.05,
    maxDash: 1.0,
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
    size: 160,          // Tamanho da caixa
    ballRadius: 8,      // Raio da bolinha
    strokeWidth: 3,     // Espessura da linha
    cornerRadius: 10    // Raio dos cantos
  },
  legacy: {
    maxRadius: 120,     // Raio máximo do círculo externo
    minRadius: 36,      // Raio mínimo do círculo interno
    strokeWidth: 2,     // Espessura da linha do contorno
    ballMinScale: 0.85, // Escala mínima da bolinha (expiração)
    ballMaxScale: 1.15  // Escala máxima da bolinha (inspiração)
  }
};
```

### 3. Detecção Automática do Box Breathing

O sistema detecta automaticamente padrões Box Breathing e ativa o estilo **Legacy** através do método `_isBoxBreathingPattern()`:

**Critérios de Detecção:**
- ✅ Exatamente 4 fases (INHALE, HOLD_IN, EXHALE, HOLD_OUT)
- ✅ Todas as durações são iguais
- ✅ Nome do padrão é "Box Plus"

**Exemplo de Padrão Detectado:**
```javascript
new BreathingPattern('Box Plus', [
  { type: PHASE_TYPES.INHALE, duration: 6 },
  { type: PHASE_TYPES.HOLD_IN, duration: 6 },
  { type: PHASE_TYPES.EXHALE, duration: 6 },
  { type: PHASE_TYPES.HOLD_OUT, duration: 6 }
])
```

### 4. Como a Animação Legacy Funciona

**Conceito da Animação Legacy:**
- **Círculo Externo**: Contorno fixo que define os limites da "caixa"
- **Círculo Interno**: Expande e contrai suavemente conforme a respiração
- **Texto Central**: Mostra a fase atual e contador regressivo
- **Cores Dinâmicas**: Muda conforme a fase da respiração

**Mapeamento das Fases:**
1. **INHALE**: Círculo interno cresce suavemente
2. **HOLD_IN**: Círculo interno mantém tamanho máximo
3. **EXHALE**: Círculo interno diminui suavemente
4. **HOLD_OUT**: Círculo interno mantém tamanho mínimo

**Cálculo da Animação:**
```javascript
_drawLegacyAnimation(progress, currentPhase, phaseElapsed) {
  const maxRadius = Math.min(centerX, centerY) * 0.8;
  const minRadius = maxRadius * 0.3;
  
  // Círculo externo fixo
  this.ctx.arc(centerX, centerY, maxRadius, 0, 2 * Math.PI);
  
  // Círculo interno que varia
  const currentRadius = minRadius + (maxRadius - minRadius) * (progress * 0.3);
  this.ctx.arc(centerX, centerY, currentRadius, 0, 2 * Math.PI);
}
```

### 5. Diferenças Entre Box e Legacy

**Estilo Box:**
- Bolinha percorre o perímetro de uma caixa quadrada
- Movimento linear ao longo dos lados
- Ideal para visualizar o "caminho" da respiração

**Estilo Legacy:**
- Círculo que se expande e contrai no centro
- Movimento suave e orgânico
- Baseado na animação clássica de exercícios de respiração
- Ativado automaticamente para Box Breathing
    case 'HOLD_IN':
      return { x: right, y: bottom - (bottom - top) * progress };
    // ... outras fases
  }
}
```

## Principais Melhorias para Estilo Limpo

### ✅ **Redução de Complexidade Visual**
- **Menos efeitos**: Removidos gradientes complexos e efeitos de pulsação
- **Cores sólidas**: Uso de cores base com sutis gradientes lineares
- **Sombras suaves**: Blur reduzido para efeito mais discreto

### ✅ **Melhor Legibilidade**
- **Texto sempre branco**: Melhor contraste em todos os fundos
- **Hierarquia clara**: Diferentes opacidades para diferentes informações
- **Fonte maior**: Texto principal mais visível

### ✅ **Performance Otimizada**
- **Menos cálculos**: Remoção de efeitos desnecessários
- **Renderização mais eficiente**: Menos operações de contexto
- **Código mais limpo**: Funções simplificadas

### ✅ **Consistência Visual**
- **Estilos harmonizados**: Ambos os estilos seguem a mesma linguagem visual
- **Proporções equilibradas**: Tamanhos e espaçamentos otimizados
- **Transições suaves**: Animações fluidas entre fases

## Diferenças da Versão Anterior

### Ring (Anel)
- ❌ **Removido**: Pontos de destaque nas extremidades
- ❌ **Removido**: Rotação complexa baseada na fase
- ❌ **Removido**: Gradientes intensos (0.3 → 0.2)
- ✅ **Melhorado**: Sombra mais sutil (blur 15 → 10)
- ✅ **Melhorado**: Linha mais fina (8px → 6px)

### Bordered (Bordas)
- ❌ **Removido**: Gradientes radiais complexos
- ❌ **Removido**: Efeito de pulsação adicional
- ❌ **Removido**: Múltiplos contextos de gradiente
- ✅ **Melhorado**: Raio base menor (0.4 → 0.25)
- ✅ **Melhorado**: Linhas mais finas (3px → 2px)
- ✅ **Melhorado**: Espaçamento otimizado (15 → 12)

### Texto Central
- ❌ **Removido**: Detecção de CSS custom properties
- ❌ **Removido**: Cores variáveis baseadas no tema
- ✅ **Melhorado**: Cor fixa branca para melhor contraste
- ✅ **Melhorado**: Fonte maior (0.08 → 0.1)
- ✅ **Melhorado**: Hierarquia visual com opacidades

## Como Usar

### Alternar Entre Estilos
1. Acesse a seção de "Prática Livre"
2. Encontre os controles "Estilo de Animação"
3. Clique em "Ring" ou "Bordered" para alternar
4. A animação mudará imediatamente com o novo estilo limpo

### Configurar Sessão
1. Selecione a duração desejada (5, 10, 15 minutos ou contínuo)
2. Escolha o estilo de animação
3. Selecione um padrão de respiração
4. Clique em "Iniciar"

## Melhorias Técnicas

### Performance
- **Renderização Otimizada**: Menos operações de contexto por frame
- **Menos Cálculos**: Remoção de efeitos matemáticos complexos
- **Código Mais Limpo**: Funções simplificadas e focadas

### Responsividade
- **Proporções Fixas**: Tamanhos relativos ao canvas
- **Texto Escalável**: Fontes que se ajustam ao tamanho da tela
- **Layout Consistente**: Mesma experiência em todos os dispositivos

### Manutenibilidade
- **Código Mais Simples**: Menos complexidade para manutenção
- **Configurações Centralizadas**: Parâmetros fáceis de ajustar
- **Estrutura Clara**: Separação clara entre estilos
