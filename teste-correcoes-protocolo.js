// Teste das correções do protocolo
// Para executar no console do navegador

console.log('=== TESTE DAS CORREÇÕES DO PROTOCOLO ===');

// Navega para a seção de prática
PranaHub.showSection('practice');

setTimeout(() => {
  // Muda para a aba de protocolo
  const protocolTab = document.getElementById('tab-protocol');
  if (protocolTab) {
    protocolTab.click();
    console.log('✅ Mudou para aba Protocolo');
    
    setTimeout(() => {
      // Testa seleção de protocolo
      const protocolSelect = document.getElementById('protocolSelect');
      if (protocolSelect && protocolSelect.options.length > 0) {
        protocolSelect.selectedIndex = 0;
        protocolSelect.dispatchEvent(new Event('change'));
        console.log('✅ Protocolo selecionado');
        
        setTimeout(() => {
          // Testa iniciar protocolo
          const startBtn = document.getElementById('startProtocolBtn');
          if (startBtn && !startBtn.disabled) {
            console.log('✅ Botão de iniciar está habilitado');
            console.log('🎯 TESTE MANUAL NECESSÁRIO:');
            console.log('1. Clique em "Confirmar Início"');
            console.log('2. Aguarde transição entre estágios');
            console.log('3. Teste botão "Cancelar Protocolo"');
            console.log('4. Verifique se permanece na página de prática');
          } else {
            console.log('❌ Botão de iniciar está desabilitado');
          }
        }, 500);
      } else {
        console.log('❌ Erro: Protocolos não carregados');
      }
    }, 500);
  } else {
    console.log('❌ Erro: Tab de protocolo não encontrada');
  }
}, 1000);

// Função para monitorar estado do protocolo
window.monitorProtocol = () => {
  const engine = window.PranaApp?.protocolEngine;
  if (engine) {
    console.log('📊 Estado atual do protocolo:', engine.state);
    console.log('📊 Estágio atual:', engine.currentStageIndex);
    console.log('📊 Protocolo:', engine.currentProtocol?.name);
  } else {
    console.log('❌ ProtocolEngine não encontrado');
  }
};

console.log('💡 Use monitorProtocol() para verificar o estado em tempo real');
console.log('=====================================');
