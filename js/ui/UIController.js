// js/ui/UIController.js
import { patterns } from '../data/patterns.js';
import { protocols } from '../data/protocols.js';
import { ProtocolStates } from '../engines/ProtocolEngine.js';
import { getStageGuide } from '../data/protocolStageGuides.js';

export class UIController {
  constructor() {
    this.selectedDuration = 5;
    this.activeTab = 'pattern';

    this.practiceState = {
      pattern: { selectedIndex: 0, duration: 5 },
      protocol: { selectedIndex: 0 }
    };
    
    this.isExerciseActive = false; // Controla se há exercício em andamento
    this._visibilityHandler = null; // Handler para detecção de saída da aba

    this.cacheDOMElements();
    this.populateSelects();
    this.initTheme(); 
  }

  wireEngines(protocolEngine, animationEngine, audioEngine) {
    this.protocolEngine = protocolEngine;
    this.animationEngine = animationEngine;
    this.audioEngine = audioEngine;
    this.bindEventListeners();
    this.initAudioState(); 
  }
    
  initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-theme');
    }
    this.themeBtn.textContent = document.body.classList.contains('dark-theme') ? '☀️' : '🌙';
  }

  initAudioState() {
    const isMuted = !this.audioEngine.enabled;
    this.updateAudioButtons(isMuted);
  }

  toggleAudio() {
    const isEnabled = this.audioEngine.enabled;
    this.audioEngine.setMuted(isEnabled);
    this.updateAudioButtons(isEnabled);
  }

  updateAudioButtons(isMuted) {
    if (this.audioBtn) {
      this.audioBtn.textContent = isMuted ? '🔇' : '🔊';
      this.audioBtn.setAttribute('aria-pressed', !isMuted);
      this.audioBtn.setAttribute('data-tooltip', isMuted ? 'Ligar Som' : 'Desligar Som');
    }

    this.audioControls?.forEach(btn => {
      btn.textContent = isMuted ? '🔇' : '🔊';
      btn.setAttribute('aria-pressed', !isMuted);
      btn.title = isMuted ? 'Ativar áudio' : 'Desativar áudio';
      
      if (isMuted) {
        btn.classList.add('muted');
      } else {
        btn.classList.remove('muted');
      }
    });
  }

  cacheDOMElements() {
    this.header = document.querySelector('header');
    this.hubSections = document.querySelectorAll('.section');
    this.navItems = document.querySelectorAll('.nav-item');
    this.protocolTabs = document.querySelectorAll('.protocol-tab');
    this.protocolContainers = document.querySelectorAll('.protocol-container');

    this.practiceSection = document.getElementById('practice');
    this.tabPattern = document.getElementById('tab-pattern');
    this.tabProtocol = document.getElementById('tab-protocol');
    this.contentPattern = document.getElementById('content-pattern');
    this.contentProtocol = document.getElementById('content-protocol');
    
    this.patternSelect = document.getElementById('patternSelect');
    this.startPatternBtn = document.getElementById('startPatternBtn');
    this.stopBtn = document.getElementById('stopBtn');
    
    this.patternDescription = document.getElementById('patternDescription');
    this.patternDescriptionContainer = document.querySelector('.pattern-description');
    
    this.protocolSelect = document.getElementById('protocolSelect');
    this.startProtocolBtn = document.getElementById('startProtocolBtn');
    this.skipStageBtn = document.getElementById('skipStageBtn');
    this.cancelProtocolBtn = document.getElementById('cancelProtocolBtn');
    this.stageStatus = document.getElementById('stageStatus');
    this.protocolProgress = document.getElementById('protocolProgress');
    this.protocolTimer = document.getElementById('protocolTimer');
    this.nextPreview = document.getElementById('nextPreview');
    
    this.audioBtn = document.getElementById('audioBtn');
    this.audioControls = document.querySelectorAll('.audio-control');
    this.volSlider = document.getElementById('volSlider');
    this.themeBtn = document.getElementById('themeBtn');
    this.timerButtons = document.querySelectorAll('.timer-btn');
    this.styleButtons = document.querySelectorAll('.style-btn');
  }

  populateSelects() {
    patterns.forEach((p, i) => {
      this.patternSelect.innerHTML += `<option value="${i}">${p.name}</option>`;
    });
    protocols.forEach((p, i) => {
      this.protocolSelect.innerHTML += `<option value="${i}">${p.name}</option>`;
    });
  }

  bindEventListeners() {
    this.tabPattern?.addEventListener('click', () => {
      this.showPracticeTab('pattern');
    });
    this.tabProtocol?.addEventListener('click', () => {
      this.showPracticeTab('protocol');
    });

    this.startPatternBtn?.addEventListener('click', () => {
      this.audioEngine.resumeContext();
      const selectedPattern = patterns[this.patternSelect.value];
      this.animationEngine.loadPattern(selectedPattern);
      this.animationEngine.setTimer(this.selectedDuration, () => {
        this.animationEngine.stop();
        this.stopBtn.disabled = true;
        this.startPatternBtn.disabled = false;
        this.setExerciseActive(false);
        this.updatePatternInfo(null);
      });
      this.animationEngine.start();
      this.stopBtn.disabled = false;
      this.startPatternBtn.disabled = true;
      this.setExerciseActive(true);
      this.updatePatternInfo(selectedPattern);
    });
    
    this.stopBtn?.addEventListener('click', () => {
      this.animationEngine.stop();
      this.stopBtn.disabled = true;
      this.startPatternBtn.disabled = false;
      this.setExerciseActive(false);
      this.updatePatternInfo(null);
    });
    
    this.protocolSelect?.addEventListener('change', (e) => {
      this.protocolEngine.selectProtocol(parseInt(e.target.value));
    });
    
    this.startProtocolBtn?.addEventListener('click', () => {
      this.audioEngine.resumeContext();
      this.setExerciseActive(true);
      this.protocolEngine.startSelectedProtocol();
    });
    
    this.cancelProtocolBtn?.addEventListener('click', () => {
      this.protocolEngine.cancelProtocol();
      this.setExerciseActive(false);
      this.showPracticeTab('pattern');
    });
    
    this.skipStageBtn?.addEventListener('click', () => {
      if (this.protocolEngine.currentStageIndex < this.protocolEngine.currentProtocol.stages.length - 1) {
        this.protocolEngine._transitionToStage(this.protocolEngine.currentStageIndex + 1);
      }
    });
    
    this.timerButtons?.forEach(btn => {
      btn.addEventListener('click', () => {
        this.timerButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedDuration = parseInt(btn.dataset.minutes) || 0;
      });
    });
    
    this.audioBtn?.addEventListener('click', () => {
      this.toggleAudio();
    });
    
    this.audioControls?.forEach(btn => {
      btn.addEventListener('click', () => {
        this.toggleAudio();
      });
    });
    
    this.volSlider?.addEventListener('input', (e) => {
      this.audioEngine.setVolume(parseFloat(e.target.value));
    });
    
    this.themeBtn?.addEventListener('click', () => {
      document.body.classList.toggle('dark-theme');
      const isDark = document.body.classList.contains('dark-theme');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      this.themeBtn.textContent = isDark ? '☀️' : '🌙';
    });
    
    this.patternSelect?.addEventListener('change', () => {
      this._updateBoxButtonState();
    });
    
    this.styleButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.styleButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const style = btn.dataset.style;
        this.animationEngine.setAnimationStyle(style);
      });
    });
    
    this._updateBoxButtonState();
  }

  _updateBoxButtonState() {
    if (!this.styleButtons) return;
    const selectedPatternIdx = this.patternSelect?.value ?? 0;
    const selectedPattern = patterns?.[selectedPatternIdx] || (patterns ? patterns[0] : null);
    const boxBtn = Array.from(this.styleButtons).find(btn => btn.dataset.style === 'Box');
    if (!boxBtn) return;
    if (selectedPattern && selectedPattern.name === 'Box Plus') {
      boxBtn.disabled = false;
      boxBtn.style.opacity = '1';
      boxBtn.style.pointerEvents = '';
      boxBtn.classList.remove('disabled');
    } else {
      boxBtn.disabled = true;
      boxBtn.style.opacity = '0.4';
      boxBtn.style.pointerEvents = 'none';
      boxBtn.classList.add('disabled');
      if (boxBtn.classList.contains('active')) {
        boxBtn.classList.remove('active');
        const ringBtn = Array.from(this.styleButtons).find(btn => btn.dataset.style === 'Ring');
        if (ringBtn) ringBtn.classList.add('active');
      }
    }
  }

  _saveCurrentState() {
    if (this.activeTab === 'pattern') {
      this.practiceState.pattern.selectedIndex = this.patternSelect.selectedIndex;
      this.practiceState.pattern.duration = this.selectedDuration;
    } else {
      this.practiceState.protocol.selectedIndex = this.protocolSelect.selectedIndex;
    }
  }

  _restoreCurrentState() {
    if (this.activeTab === 'pattern') {
      this.patternSelect.selectedIndex = this.practiceState.pattern.selectedIndex;
      this.selectedDuration = this.practiceState.pattern.duration;
      this.timerButtons.forEach(btn => {
        const btnDuration = parseInt(btn.dataset.minutes) || 0;
        btn.classList.toggle('active', btnDuration === this.selectedDuration);
      });
    } else {
      this.protocolSelect.selectedIndex = this.practiceState.protocol.selectedIndex;
      this.protocolEngine.selectProtocol(this.practiceState.protocol.selectedIndex);
    }
  }

  updatePatternInfo(pattern) {
    this.updatePatternDescription(pattern);
  }

  updatePatternDescription(pattern) {
    if (!this.patternDescription || !this.patternDescriptionContainer) return;
    
    if (pattern) {
      const duration = this.selectedDuration > 0 ? `${this.selectedDuration} min` : 'contínuo';
      const description = this.getPatternDescription(pattern);
      
      this.patternDescription.textContent = `${pattern.name}: ${description} (${duration})`;
      this.patternDescriptionContainer.classList.add('active');
    } else {
      this.patternDescription.textContent = 'Selecione um padrão de respiração para começar sua prática';
      this.patternDescriptionContainer.classList.remove('active');
    }
  }

  getPatternDescription(pattern) {
    const descriptions = {
      'Sossega Leão': 'Relaxamento profundo com expiração prolongada',
      'Box Plus': 'Equilíbrio e foco com ritmo simétrico', 
      'Energia Calma': 'Ativação suave para começar o dia',
      'Calma': 'Tranquilidade imediata com respiração simples',
      'Endurance': 'Resistência respiratória e tolerância ao CO₂',
      'Melhor Ventilação': 'Otimização da troca gasosa pulmonar',
      'Tranquilidade': 'Paz mental com ritmo suave e natural',
      'Tactical': 'Alerta calmo para situações de pressão'
    };
    
    return descriptions[pattern.name] || 'Padrão personalizado de respiração';
  }

  showSection(sectionId) {
    this.hubSections.forEach(section => {
      section.classList.remove('active', 'section-fade-in');
      section.style.display = 'none';
    });
    this.navItems.forEach(item => item.classList.remove('active'));

    const homeSection = document.getElementById('home');
    if (sectionId === 'home') {
      if (homeSection) {
        homeSection.style.display = 'flex';
        homeSection.classList.add('active', 'section-fade-in');
      }
    } else {
      if (homeSection) homeSection.style.display = 'none';
      const sectionToShow = document.getElementById(sectionId);
      if (sectionToShow) {
        sectionToShow.style.display = 'block';
        void sectionToShow.offsetWidth;
        sectionToShow.classList.add('active', 'section-fade-in');
      }
    }

    const navItemToActivate = Array.from(this.navItems).find(nav => 
      nav.getAttribute('data-section') === sectionId
    );
    if (navItemToActivate) {
      navItemToActivate.classList.add('active');
    }
  }

  showProtocol(protocolId) {
    this.protocolContainers.forEach(container => container.classList.remove('active'));
    this.protocolTabs.forEach(tab => tab.classList.remove('active'));
    
    const containerToShow = document.getElementById(protocolId);
    if (containerToShow) containerToShow.classList.add('active');
    
    const tabToActivate = document.querySelector(`.protocol-tab[onclick*="'${protocolId}'"]`);
    if (tabToActivate) tabToActivate.classList.add('active');
  }

  showPracticeTab(tabId) {
    if (this.activeTab === tabId) return;

    this._saveCurrentState();
    
    const container = this.practiceSection.querySelector('.loading-overlay');
    container.classList.add('loading');

    setTimeout(() => {
      this.activeTab = tabId;

      if (tabId === 'pattern') {
        this.contentPattern.style.display = 'block';
        this.contentProtocol.style.display = 'none';
        this.tabPattern.classList.add('active');
        this.tabProtocol.classList.remove('active');
        
        const activeStyleBtn = document.querySelector('.style-btn.active');
        if (activeStyleBtn) {
          const userSelectedStyle = activeStyleBtn.dataset.style;
          this.animationEngine.setAnimationStyle(userSelectedStyle);
        }
      } else {
        this.contentPattern.style.display = 'none';
        this.contentProtocol.style.display = 'block';
        this.tabPattern.classList.remove('active');
        this.tabProtocol.classList.add('active');
        
        this.animationEngine.setAnimationStyle('Legacy');
      }
      
      this._restoreCurrentState();
      container.classList.remove('loading');
    }, 300);
  }

  selectProtocolInUI(index) {
    if (this.protocolSelect) {
      this.protocolSelect.selectedIndex = index;
      this.practiceState.protocol.selectedIndex = index;
    }
    this.showPracticeTab('protocol');
  }

  // ÚNICO sistema mantido: detecção de saída da aba
  setExerciseActive(active = true) {
    this.isExerciseActive = !!active;
    
    if (active) {
      this._startTabVisibilityMonitoring();
    } else {
      this._stopTabVisibilityMonitoring();
    }
  }

  _startTabVisibilityMonitoring() {
    if (this._visibilityHandler) return;
    
    this._visibilityHandler = () => {
      if (document.hidden && this.isExerciseActive) {
        console.log('🔍 Usuário saiu da aba durante exercício - parando automaticamente');
        this._handleTabExit();
      }
    };
    
    document.addEventListener('visibilitychange', this._visibilityHandler);
  }

  _stopTabVisibilityMonitoring() {
    if (this._visibilityHandler) {
      document.removeEventListener('visibilitychange', this._visibilityHandler);
      this._visibilityHandler = null;
    }
  }

  _handleTabExit() {
    // Para exercício e limpa estado
    if (this.animationEngine) {
      this.animationEngine.stop();
    }
    if (this.protocolEngine) {
      this.protocolEngine.cancelProtocol();
    }
    
    // Reseta botões
    if (this.startPatternBtn) this.startPatternBtn.disabled = false;
    if (this.stopBtn) this.stopBtn.disabled = true;
    if (this.startProtocolBtn) this.startProtocolBtn.disabled = false;
    if (this.cancelProtocolBtn) this.cancelProtocolBtn.disabled = true;
    
    this.setExerciseActive(false);
  }

  update({ engineState }) {
    if (!engineState || !engineState.state) return;
    
    const { state, currentProtocol, currentStageIndex, progress } = engineState;
    const isFinished = state === ProtocolStates.FINISHED;
    const isPreparing = state === ProtocolStates.PREPARING;
    const isRunning = state === ProtocolStates.RUNNING;
    const isTransition = state === ProtocolStates.TRANSITION;

    this.startProtocolBtn.disabled = !isPreparing;
    this.cancelProtocolBtn.disabled = isPreparing || isFinished;
    if (this.skipStageBtn) this.skipStageBtn.disabled = !isRunning;
    
    if (isFinished) {
      this.stageStatus.innerHTML = `
        <div class="protocol-completed">
          <h3>🎉 Protocolo Concluído!</h3>
          <p>Seu sistema nervoso foi otimizado com sucesso. Observe as sensações de equilíbrio e clareza.</p>
        </div>
      `;
      this.protocolTimer.textContent = 'Protocolo finalizado com sucesso';
      this.nextPreview.textContent = '';
      this.protocolProgress.value = this.protocolProgress.max;
      return;
    }

    if (currentProtocol && currentStageIndex !== undefined) {
      const stage = currentProtocol.stages[currentStageIndex];
      const stageGuide = getStageGuide(currentProtocol.id, currentStageIndex);
      
      if (isTransition) {
        this.stageStatus.innerHTML = `
          <div class="transition-state">
            <h3>⚡ Transição Neuroplástica</h3>
            <p>Seu sistema nervoso está se adaptando. Observe as mudanças sutis nas sensações corporais.</p>
          </div>
        `;
        
        const nextStage = currentProtocol.stages[currentStageIndex + 1];
        if (nextStage) {
          const nextGuide = getStageGuide(currentProtocol.id, currentStageIndex + 1);
          this.nextPreview.innerHTML = nextGuide ? 
            `<strong>A seguir:</strong> ${nextGuide.title} - ${nextGuide.subtitle}` :
            `A seguir: ${nextStage.pattern.name}`;
        }
      } else if (isRunning && stageGuide) {
        this.stageStatus.innerHTML = `
          <div class="stage-guide">
            <div class="stage-header">
              <span class="stage-number">Estágio ${currentStageIndex + 1}/${currentProtocol.stages.length}</span>
              <h3 class="stage-title">${stageGuide.title}</h3>
              <p class="stage-subtitle">${stageGuide.subtitle}</p>
            </div>
            <p class="stage-description">${stageGuide.description}</p>
          </div>
        `;
      } else {
        this.stageStatus.textContent = `Estágio ${currentStageIndex + 1}/${currentProtocol.stages.length}: ${stage.pattern.name}`;
      }
      
      if (progress.totalProtocolTime && progress.totalElapsed !== undefined) {
        const totalSec = progress.totalProtocolTime;
        const elapsedSec = progress.totalElapsed;
        const remainingSec = Math.max(0, totalSec - elapsedSec);
        const min = Math.floor(remainingSec / 60);
        const sec = Math.floor(remainingSec % 60);
        this.protocolTimer.textContent = `Tempo restante: ${min}:${sec.toString().padStart(2, '0')}`;

        this.protocolProgress.value = elapsedSec;
        this.protocolProgress.max = totalSec;
        
        this.protocolProgress.setAttribute('aria-valuenow', elapsedSec.toFixed(0));
        this.protocolProgress.setAttribute('aria-valuemax', totalSec.toFixed(0));
        const percent = totalSec > 0 ? Math.round((elapsedSec / totalSec) * 100) : 0;
        this.protocolProgress.setAttribute('aria-valuetext', `${percent}% concluído`);
      }
      
      if (!isTransition) {
        this.nextPreview.textContent = '';
      }
      
    } else if (isPreparing) {
      if (this.protocolSelect.selectedIndex >= 0) {
        const selectedProtocol = protocols[this.protocolSelect.selectedIndex];
        this.stageStatus.innerHTML = `
          <div class="protocol-ready">
            <h3>🧘 Pronto para Começar</h3>
            <p><strong>${selectedProtocol.name}</strong></p>
            <p class="protocol-intention">Prepare-se para uma jornada neurofisiológica guiada de transformação consciente.</p>
          </div>
        `;
        this.protocolTimer.textContent = `Duração total: ${selectedProtocol.totalDurationMinutes} min`;
      } else {
        this.stageStatus.textContent = 'Selecione um protocolo';
        this.protocolTimer.textContent = '';
      }
      this.protocolProgress.value = 0;
      this.protocolProgress.setAttribute('aria-valuenow', '0');
    } else {
      this.stageStatus.textContent = '';
      this.protocolTimer.textContent = '';
      this.nextPreview.textContent = '';
      this.protocolProgress.value = 0;
    }
  }
}
