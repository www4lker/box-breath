// Teste da nova animação Legacy
// Para executar no console do navegador

console.log('=== TESTE DA ANIMAÇÃO LEGACY ===');

// Verifica se a animação Legacy está disponível
const animationEngine = window.prana?.animationEngine;
if (!animationEngine) {
  console.error('❌ AnimationEngine não encontrado');
} else {
  console.log('✅ AnimationEngine encontrado');
  
  // Verifica se o método setAnimationStyle aceita 'Legacy'
  try {
    animationEngine.setAnimationStyle('Legacy');
    console.log('✅ Estilo Legacy aceito');
  } catch (error) {
    console.error('❌ Erro ao definir estilo Legacy:', error);
  }
  
  // Verifica se o método _drawLegacyAnimation existe
  if (typeof animationEngine._drawLegacyAnimation === 'function') {
    console.log('✅ Método _drawLegacyAnimation encontrado');
  } else {
    console.error('❌ Método _drawLegacyAnimation não encontrado');
  }
  
  // Verifica se as configurações Legacy estão presentes
  if (animationEngine.config && animationEngine.config.legacy) {
    console.log('✅ Configurações Legacy encontradas:', animationEngine.config.legacy);
  } else {
    console.error('❌ Configurações Legacy não encontradas');
  }
}

// Verifica se o botão Legacy está presente no HTML
const legacyButton = document.querySelector('[data-style="Legacy"]');
if (legacyButton) {
  console.log('✅ Botão Legacy encontrado no HTML');
} else {
  console.error('❌ Botão Legacy não encontrado no HTML');
}

// Testa a detecção automática com Box Breathing
console.log('\n=== TESTE DE DETECÇÃO AUTOMÁTICA ===');
const patterns = window.prana?.patternManager?.patterns || [];
const boxPattern = patterns.find(p => p.name === 'Box Plus');
if (boxPattern) {
  console.log('✅ Padrão Box Plus encontrado:', boxPattern);
  
  // Simula o carregamento do padrão
  if (animationEngine) {
    const currentStyle = animationEngine.animationStyle;
    animationEngine.loadPattern(boxPattern);
    console.log(`📝 Estilo antes: ${currentStyle}, depois: ${animationEngine.animationStyle}`);
    
    if (animationEngine.animationStyle === 'Legacy') {
      console.log('✅ Detecção automática funcionando - mudou para Legacy');
    } else {
      console.log('⚠️  Detecção automática não funcionou - manteve:', animationEngine.animationStyle);
    }
  }
} else {
  console.error('❌ Padrão Box Plus não encontrado');
}

console.log('\n=== TESTE COMPLETO ===');
