function updateSaibaMaisContent() {
  const saibaMais = document.getElementById('saiba-mais');
  if (!saibaMais) return;
  
  const techniqueSelect = document.getElementById('technique-select');
  const technique = techniqueSelect ? techniqueSelect.value : 'box';
  
  let title, content;
  
  switch (technique) {
    case 'box':
      title = 'Saiba mais sobre Box Breathing (Respiração da Caixa)';
      content = `
        <p>A técnica de respiração quadrada, também conhecida como "Box Breathing", é um método poderoso 
        utilizado por atletas de elite, militares e profissionais de alto desempenho para melhorar o foco 
        e reduzir o estresse.</p>
        <p>O padrão 4-4-4-4 equilibra o sistema nervoso, promovendo uma resposta de relaxamento e melhorando 
        a concentração.</p>
        <p>Benefícios incluem: redução da ansiedade, melhora da concentração e melhor oxigenação do corpo.</p>
      `;
      break;
    case 'alternate':
      title = 'Respiração Alternada';
      content = `
        <p>A respiração alternada (ou Nadi Shodhana) é uma técnica tradicional do Yoga que equilibra os hemisférios cerebrais
        e acalma o sistema nervoso.</p>
        <p>Alterne a respiração entre as narinas direita e esquerda, criando um fluxo circular e harmonioso de energia.</p>
        <p>Benefícios incluem: equilíbrio emocional, clareza mental e redução de tensões.</p>
      `;
      break;
    // ...existing code for other cases...
    default:
      title = 'Sobre a Técnica';
      content = '<p>Selecione uma técnica para ver mais informações.</p>';
  }
  
  const headerElement = saibaMais.querySelector('.saiba-mais-header span:first-child');
  if (headerElement) {
    headerElement.textContent = title;
  }
  
  const contentElement = saibaMais.querySelector('.saiba-mais-content');
  if (contentElement) {
    contentElement.innerHTML = content;
  }
}

function initializeSaibaMais() {
  const saibaMais = document.getElementById('saiba-mais');
  if (!saibaMais) {
    console.error('Elemento saiba-mais não encontrado');
    return;
  }
  
  saibaMais.addEventListener('click', function() {
    this.classList.toggle('collapsed');
    this.classList.toggle('expanded');
    
    const toggleIndicator = this.querySelector('.toggle-indicator');
    if (toggleIndicator) {
      toggleIndicator.textContent = this.classList.contains('expanded') ? '-' : '+';
    }
  });
  
  updateSaibaMaisContent();
}

document.addEventListener('DOMContentLoaded', function() {
  initializeSaibaMais();
  
  const techniqueSelect = document.getElementById('technique-select');
  if (techniqueSelect) {
    techniqueSelect.addEventListener('change', updateSaibaMaisContent);
  }
});
