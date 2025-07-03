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
            practicePattern: (patternIndex) => this.practicePattern(patternIndex)
        };
    }
    
    practicePattern(patternIndex) {
        this.uiController.showSection('practice');
        this.uiController.showPracticeTab('pattern');
        this.uiController.patternSelect.value = patternIndex;
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
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    window.PranaApp = app;
    
    // Define PranaHub globalmente para uso nos onclick do HTML
    window.PranaHub = {
        startPracticeMode: (protocolId) => app.startPracticeMode(protocolId),
        showSection: (sectionId) => app.uiController.showSection(sectionId),
        showProtocol: (protocolId) => app.uiController.showProtocol(protocolId),
        practicePattern: (patternIndex) => app.practicePattern(patternIndex)
    };
});