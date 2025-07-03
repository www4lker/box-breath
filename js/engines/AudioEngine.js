// js/engines/AudioEngine.js

// AudioEngine — Sinais Sonoros para Ciclos Respiratórios
// Utiliza Web Audio API para tocar tons marcando transição entre fases

export class AudioEngine {
  constructor() {
    // AudioContext será criado apenas quando necessário (após gesto do usuário)
    this.ctx = null;
    this.gainNode = null;
    this.enabled = true; // Flag mute/unmute
    this.volume = 0.7;   // Volume padrão (0.0 — 1.0)
    this.initialized = false;
  }

  // Inicializa o AudioContext após gesto do usuário
  _initializeAudioContext() {
    if (this.initialized || this.ctx) return true;
    
    try {
      this.ctx = window.AudioContext ? new AudioContext() :
                window.webkitAudioContext ? new webkitAudioContext() : null;
      
      if (this.ctx) {
        // Cria um nó de volume (gainNode) para controle global
        this.gainNode = this.ctx.createGain();
        this.gainNode.gain.value = this.enabled ? this.volume : 0;
        this.gainNode.connect(this.ctx.destination);
        this.initialized = true;
        console.log('[AudioEngine] AudioContext inicializado com sucesso após gesto do usuário');
        return true;
      }
    } catch (e) {
      console.warn('[AudioEngine] Erro ao criar AudioContext:', e);
      this.ctx = null;
    }
    
    return false;
  }

  // Workaround para browsers que requerem uma interação antes do áudio
  resumeContext() {
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  // Permite usuário silenciar ou ativar som
  setMuted(mute) {
    this.enabled = !mute;
    if (this.gainNode) this.gainNode.gain.value = mute ? 0 : this.volume;
  }

  // Método para preparar o AudioEngine após gesto do usuário
  prepareForUse() {
    if (this.initialized) return true;
    return this._initializeAudioContext();
  }

  // Permite ajuste de volume (0.0 a 1.0)
  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.gainNode) this.gainNode.gain.value = this.enabled ? this.volume : 0;
  }

  /**
   * Tocar um tom característico para cada fase
   * @param {string} phaseType (INHALE, HOLD_IN, EXHALE, HOLD_OUT)
   */
  playPhaseCue(phaseType) {
    if (!this.enabled) return;
    
    // Inicializa AudioContext na primeira tentativa de reprodução (após gesto do usuário)
    if (!this._initializeAudioContext()) return;
    
    this.resumeContext();

    // INSPIRAR: Tom ascendente suave (220Hz → 330Hz, 0.5s)
    if (phaseType === 'INHALE') {
      this._playGlide(220, 330, 0.5);

    // SEGURAR CHEIO: Tom agudo curto (440Hz, 0.2s)
    } else if (phaseType === 'HOLD_IN') {
      this._playTone(440, 0.2);

    // EXPIRAR: Tom descendente suave (330Hz → 220Hz, 0.5s)
    } else if (phaseType === 'EXHALE') {
      this._playGlide(330, 220, 0.5);

    // SEGURAR VAZIO: Tom grave curto (165Hz, 0.2s)
    } else if (phaseType === 'HOLD_OUT') {
      this._playTone(165, 0.2);
    }
  }

  /**
   * Toca um tom puro por tempo fixo, com leve envelope.
   * Exemplo: playTone(440, 0.2) — Tom agudo, curta duração
   */
  _playTone(freq, duration = 0.2) {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();

    // Envelope ADSR simples — ataque/decay breves para suavizar início/fim
    const attack = 0.02, decay = 0.03, release = 0.04;
    const now = this.ctx.currentTime;

    // Inicializações de volume
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(1, now + attack);
    g.gain.linearRampToValueAtTime(0.9, now + attack + decay);
    g.gain.linearRampToValueAtTime(0, now + duration + release);

    // Conexão na cadeia de áudio
    o.type = 'sine';
    o.frequency.value = freq;
    o.connect(g);
    g.connect(this.gainNode);

    // "Desliga" nodes após o som (evita vazamento de memória)
    o.start(now);
    o.stop(now + duration + release + 0.02);
    o.onended = () => {
      o.disconnect();
      g.disconnect();
    };
  }

  /**
   * Toca um tom com variação suave entre duas frequências (glissando)
   * Exemplo: playGlide(220, 330, 0.5) — Tom que "sobe" em meio segundo
   */
  _playGlide(startFreq, endFreq, duration = 0.5) {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();

    // Envelope ADSR curto
    const attack = 0.04, decay = 0.05, release = 0.07;
    const now = this.ctx.currentTime;

    // Envelope de volume (evita clicks)
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(1, now + attack);
    g.gain.linearRampToValueAtTime(0.93, now + attack + decay);
    g.gain.linearRampToValueAtTime(0, now + duration + release);

    o.type = 'sine';

    // Varre a frequência suavemente durante o som
    o.frequency.setValueAtTime(startFreq, now);
    o.frequency.linearRampToValueAtTime(endFreq, now + duration);

    o.connect(g);
    g.connect(this.gainNode);

    o.start(now);
    o.stop(now + duration + release + 0.025);
    o.onended = () => {
      o.disconnect();
      g.disconnect();
    };
  }
}

/**
 * --- Comentando as escolhas das frequências ---
 * INSPIRAR       220Hz → 330Hz    (grave para médio)    - sensação de elevação
 * SEGURAR_CHEIO  440Hz            (agudo)               - atenção "máxima", topo do ciclo
 * EXPIRAR        330Hz → 220Hz    (médio para grave)    - sensação de descida/relaxamento
 * SEGURAR_VAZIO  165Hz            (grave)               - marca fundo, refere tranquilidade
 */