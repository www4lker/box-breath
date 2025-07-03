// js/engines/ProtocolEngine.js
import { log } from '../core/Logger.js';

export const ProtocolStates = {
  IDLE: "PARADO",
  PREPARING: "PREPARANDO",
  RUNNING: "EXECUTANDO",
  TRANSITION: "EM_TRANSICAO",
  FINISHED: "FINALIZADO"
};

export class ProtocolEngine {
  constructor() {
    this.protocols = []; // Será preenchido depois
    this.state = ProtocolStates.IDLE;
    this.timers = { mainLoop: null, transition: null };
    this.progress = {};
  }

  wireEngines(animationEngine, audioEngine, uiController, protocols) {
    this.animationEngine = animationEngine;
    this.audioEngine = audioEngine;
    this.uiController = uiController;
    this.protocols = protocols;
  }

  selectProtocol(index) {
    if (this.state !== ProtocolStates.IDLE && this.state !== ProtocolStates.FINISHED) return;
    this.currentProtocol = this.protocols[index];
    this.currentStageIndex = 0;
    this.state = ProtocolStates.PREPARING;
    this.progress.totalProtocolTime = this.currentProtocol.calculateTotalDuration() * 60;
    this.progress.totalElapsed = 0;
    log(`Protocolo selecionado: ${this.currentProtocol.name}`);
    this.uiController.update({ engineState: this });
  }

  startSelectedProtocol() {
    if (this.state !== ProtocolStates.PREPARING) return;
    this.progress.protocolStartTime = Date.now();
    this.progress.totalElapsed = 0;
    log(`Iniciando protocolo: ${this.currentProtocol.name}`);
    this._startStage(0);
  }
  
  cancelProtocol() {
    if (this.state === ProtocolStates.IDLE) return;
    this._clearTimers();
    this.state = ProtocolStates.IDLE;
    this.currentProtocol = null;
    this.currentStageIndex = 0;
    this.progress = {};
    this.animationEngine.stop();
    log("Protocolo cancelado pelo usuário.");
    
    this.uiController.update({ engineState: this });
  }

  _startStage(stageIndex) {
    this.currentStageIndex = stageIndex;
    const stage = this.currentProtocol.stages[stageIndex];
    this.state = ProtocolStates.RUNNING;
    this.progress.stageStartTime = Date.now();
    
    // Garante que a animação anterior foi completamente parada
    this.animationEngine.stop();
    setTimeout(() => {
      this.animationEngine.loadPattern(stage.pattern);
      this.animationEngine.fadeIn(1.0);
      this.animationEngine.start();
    }, 100);
    
    log(`Iniciando Estágio ${stageIndex + 1}/${this.currentProtocol.stages.length}: ${stage.pattern.name}`);
    this._startMainLoop();
    this.uiController.update({ engineState: this });
  }

  _transitionToStage(nextStageIndex) {
    if (nextStageIndex >= this.currentProtocol.stages.length) {
      return this._finishProtocol();
    }
    
    // Para o loop principal durante a transição
    this._clearTimers();
    this.state = ProtocolStates.TRANSITION;
    this.uiController.update({ engineState: this });
    this.animationEngine.fadeOut(1.5);

    this.timers.transition = setTimeout(() => {
      this._startStage(nextStageIndex);
    }, 3000);
  }
  
  _finishProtocol() {
    this._clearTimers();
    this.state = ProtocolStates.FINISHED;
    this.animationEngine.stop();
    log("Protocolo finalizado com sucesso!");
    
    this.uiController.update({ engineState: this });
  }

  _startMainLoop() {
    this._clearTimers();
    this.timers.mainLoop = setInterval(() => {
      if (this.state !== ProtocolStates.RUNNING) {
        this._clearTimers();
        return;
      }
      const stage = this.currentProtocol.stages[this.currentStageIndex];
      const stageDurationSec = stage.durationMinutes * 60;
      const stageElapsedSec = (Date.now() - this.progress.stageStartTime) / 1000;
      
      this.progress.totalElapsed = (Date.now() - this.progress.protocolStartTime) / 1000;
      this.uiController.update({ engineState: this });

      if (stageElapsedSec >= stageDurationSec) {
        this._transitionToStage(this.currentStageIndex + 1);
      }
    }, 500);
  }

  _clearTimers() {
    clearInterval(this.timers.mainLoop);
    clearTimeout(this.timers.transition);
  }
}