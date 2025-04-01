# Respiração Guiada Animações em Javascript: Seu Guia de Respiração (Um Experimento)

**"Pause a tela de trabalho, se encontre com ajuda da tela de respiração."**


![screenshot](https://i.postimg.cc/Y0gysQ6X/image.png)
[Acesse aqui](http://prana.walker.eco.br/)

## Sobre o Projeto

Esse é um aplicativo web simples e despretensioso, criado para oferecer pausas guiadas de respiração diretamente no seu navegador. Ele oferece diferentes técnicas e durações para ajudar a acalmar a mente, focar ou energizar, usando animações visuais e sons opcionais.

O mais importante sobre este projeto, no entanto, não é apenas o resultado final, mas a jornada de criação.

## A Jornada Vibe Coding

Este projeto nasceu da curiosidade e da vontade de aprender. Inspirado pelo app "One Deep Breath", percebi que a animação visual seria um bom ponto de partida para explorar a codificação assistida por Inteligência Artificial, mesmo tendo conhecimento muito básico de programação.

**O processo foi inteiramente baseado no Vibe Coding:**

> **Vibe Coding:** *Um paradigma de programação assistido por IA onde os utilizadores descrevem a funcionalidade desejada em linguagem natural para Grandes Modelos de Linguagem (LLMs), que então geram o código. Introduzido por Andrej Karpathy em fevereiro de 2025, este método muda o foco do programador da escrita de sintaxe detalhada para a definição da intenção, orientação da IA e teste dos resultados, muitas vezes aceitando e implementando o código sem um entendimento completo da sua implementação subjacente.*

Na prática, isso significou:

1.  Descrever a ideia e as funcionalidades desejadas em linguagem natural.
2.  Utilizar um assistente de IA (como este tutor) para gerar o código HTML, CSS e JavaScript em etapas.
3.  Testar o código gerado, identificar problemas ou novas necessidades.
4.  Refinar a descrição ou pedir correções à IA, em ciclos iterativos.
5.  Aprender os conceitos básicos de programação *durante* o processo de construção.

Este README e o próprio código são um testemunho de que **é possível criar projetos funcionais para fins específicos, mesmo sem um background profundo em programação, através da paciência, da iteração constante e da colaboração com ferramentas de IA.**

## Funcionalidades Principais

*   🧘 **Múltiplas Técnicas de Respiração:** Inclui Box Breathing, 4-7-8, Respiração Diafragmática e Respiração Alternada (Nadi Shodhana).
*   🎨 **Animação Visual Guia:** Uma caixa, círculo ou representação de narinas que se movem para guiar o ritmo da respiração.
*   🔊 **Sons Guias (Opcional):** Sons suaves para indicar inspiração, expiração e retenção (pode ser silenciado).
*   ⏱️ **Tempo Configurável:** Escolha a duração total da sua sessão (5, 10 ou 15 minutos).
*   🌓 **Temas Claro e Escuro:** Adapte a aparência à sua preferência ou ambiente.
*   ℹ️ **Informações "Saiba Mais":** Descrições sobre cada técnica de respiração.
*   🌈 **Paletas de Cores Temáticas:** O esquema de cores se adapta sutilmente à categoria da técnica (Foco, Relaxamento, Energia).

## Tecnologias Utilizadas

*   **HTML5:** Estrutura da página.
*   **CSS3:** Estilização, animações básicas, variáveis CSS para temas e paletas.
*   **JavaScript (Puro/Vanilla):** Lógica da aplicação, manipulação do DOM, controle das animações, Web Audio API para os sons.
*   **Vibe Coding / LLM:** Como ferramenta principal para geração e refatoração do código.

## Como Usar

1.  Clone ou baixe este repositório.
2.  Abra o arquivo `index.html` diretamente no seu navegador web preferido.
3.  Selecione a técnica e a duração desejada.
4.  Clique em "Iniciar" e siga as instruções na tela.


## Limitações e Detalhes a Polir

Como um projeto de aprendizado e experimento, existem algumas coisinhas:

*   **Pequeno Bug Visual:** Ao trocar de técnica *antes* de iniciar, um texto residual da técnica anterior pode permanecer visível brevemente na área de instruções até que a nova sessão comece. (Não é prioridade corrigir no momento).
*   **Simplicidade:** Focado nas funcionalidades essenciais, sem recursos avançados como histórico, perfis de usuário, etc.

## Ideias Futuras (Talvez!)

*   Corrigir o bug visual mencionado.
*   Opção de criar sequências (ex: 5 min Relaxamento + 5 min Foco).
*   Mais opções de personalização de tempo/fases.
*   Explorar Progressive Web App (PWA) para instalação offline.

## Licença

MIT License

Copyright (c) 2025 Walker B Dantas

