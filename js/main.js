// js/main.js
import { AnimationEngine } from './engines/AnimationEngine.js';
import { AudioEngine } from './engines/AudioEngine.js';
import { ProtocolEngine } from './engines/ProtocolEngine.js';
import { UIController } from './ui/UIController.js';
import { log } from './core/Logger.js';
import { protocols } from './data/protocols.js';

class App {
    constructor() {
        this.animationEngine = new AnimationEngine('breath-circle');
        this.audioEngine = new AudioEngine();
        this.uiController = new UIController();
        this.protocolEngine = new ProtocolEngine();

        this.wireDependencies();
        this.exposeGlobalFunctions();
        
        this.uiController.showSection('home');
        log("App Prana Advanced construído e conectado.");
    }

    wireDependencies() {
        this.uiController.wireEngines(this.protocolEngine, this.animationEngine, this.audioEngine);
        this.protocolEngine.wireEngines(this.animationEngine, this.audioEngine, this.uiController, protocols);
        this.animationEngine.setAudioEngine(this.audioEngine);
    }

    exposeGlobalFunctions() {
        window.PranaHub = {
            startPracticeMode: (protocolId) => this.startPracticeMode(protocolId),
            showSection: (sectionId) => this.uiController.showSection(sectionId),
            showProtocol: (protocolId) => this.uiController.showProtocol(protocolId),
            practicePattern: (patternIndex) => this.practicePattern(patternIndex),
            startPatternPractice: () => this.uiController.startPatternPractice(),
            startProtocolPractice: () => this.uiController.startProtocolPractice()
        };

        // Expor funções globais para disclaimers e modais
        window.showDisclaimer = () => this.showDisclaimer();
        window.showDisclaimerModal = () => this.showDisclaimerModal();
        window.closeDisclaimerModal = () => this.closeDisclaimerModal();
    }
    
    practicePattern(patternIndex) {
        this.uiController.showSection('practice');
        this.uiController.showPracticeTab('pattern');
        this.uiController.patternSelect.value = patternIndex;
        if (typeof this.uiController._updateBoxButtonState === 'function') {
            this.uiController._updateBoxButtonState();
        }
    }

    startPracticeMode(protocolId) {
        log(`Iniciando modo de prática para o protocolo: ${protocolId}`);
        this.uiController.showSection('practice');
        this.uiController.showPracticeTab('protocol');
        const protocolIndex = this.protocolEngine.protocols.findIndex(p => p.id === protocolId);
        if (protocolIndex > -1) {
            this.protocolEngine.selectProtocol(protocolIndex);
            this.uiController.selectProtocolInUI(protocolIndex);
        } else {
            log(`Erro: Protocolo com ID '${protocolId}' não encontrado.`);
            this.uiController.showSection('protocols');
        }
    }

    // Métodos para gerenciar disclaimers e modais
    showDisclaimer() {
        // Redireciona para a função do modal completo
        this.showDisclaimerModal();
    }

    showDisclaimerModal() {
        const modal = document.getElementById('disclaimerModal');
        const content = document.getElementById('disclaimerFullText');
        if (modal && content) {
            // Mostra loading enquanto carrega
            content.textContent = 'Carregando orientações de segurança...';
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            
            fetch('breathwork-safety-disclaimer.html')
                .then(r => {
                    if (!r.ok) {
                        throw new Error(`HTTP ${r.status}: ${r.statusText}`);
                    }
                    return r.text();
                })
                .then(html => {
                    content.innerHTML = html;
                })
                .catch(error => {
                    console.error('Erro ao carregar disclaimer:', error);
                    // Fallback com conteúdo básico
                    content.innerHTML = `
                        <h1>ORIENTAÇÕES DE SEGURANÇA E TERMO DE RESPONSABILIDADE</h1>
                        <h2>Exercícios Respiratórios (Breathwork)</h2>
                        
                        <h3>⚠️ AVISO IMPORTANTE</h3>
                        <p><strong>Consulte sempre um médico antes de iniciar qualquer programa de exercícios respiratórios</strong>, especialmente se possui condições médicas preexistentes.</p>
                        
                        <h3>CONTRAINDICAÇÕES</h3>
                        <ul>
                            <li>Doenças cardiovasculares ou histórico de problemas cardíacos</li>
                            <li>Hipertensão arterial (pressão alta)</li>
                            <li>Epilepsia ou histórico de convulsões</li>
                            <li>Transtornos de ansiedade ou pânico</li>
                            <li>Asma ou outras condições respiratórias</li>
                            <li>Gravidez ou suspeita de gravidez</li>
                            <li>Diabetes</li>
                        </ul>
                        
                        <h3>PRECAUÇÕES DURANTE A PRÁTICA</h3>
                        <ul>
                            <li><strong>Nunca pratique enquanto dirige, opera máquinas ou próximo à água</strong></li>
                            <li>Interrompa imediatamente se sentir tontura forte, dor no peito, náusea ou qualquer desconforto significativo</li>
                            <li>Comece sempre com técnicas suaves e aumente gradualmente a intensidade</li>
                            <li>Pratique em ambiente seguro, preferencialmente sentado ou deitado</li>
                            <li>Mantenha-se hidratado antes e após a prática</li>
                        </ul>
                        
                        <h3>TERMO DE RESPONSABILIDADE</h3>
                        <p>O uso das técnicas de respiração apresentadas neste site é de <strong>responsabilidade exclusiva do praticante</strong>. Os criadores e mantenedores deste site não se responsabilizam por quaisquer danos, lesões ou consequências decorrentes do uso inadequado ou imprudente das técnicas.</p>
                        
                        <p><strong>Pratique com consciência e responsabilidade.</strong></p>
                        
                        <p><em>Erro ao carregar arquivo completo. Conteúdo básico exibido.</em></p>
                    `;
                });
        }
    }

    closeDisclaimerModal() {
        const modal = document.getElementById('disclaimerModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    window.PranaApp = app;
});
