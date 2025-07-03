// js/core/Logger.js
const DEBUG_MODE = true; // Mude para false em produção para desligar os logs

/**
 * Loga mensagens no console com um prefixo padrão, se o modo debug estiver ativo.
 * @param {...any} args Argumentos para logar, como em console.log
 */
export function log(...args) {
  if (DEBUG_MODE) {
    console.log('[Prana]', ...args);
  }
}