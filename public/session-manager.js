/**
 * Session Manager - Mantiene l'app attiva e gestisce i timeout
 * Previene che l'app si blocchi dopo inattività prolungata
 */

class SessionManager {
  constructor() {
    this.SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minuti
    this.HEARTBEAT_INTERVAL = 5 * 60 * 1000; // 5 minuti
    this.inactivityTimer = null;
    this.heartbeatTimer = null;
    this.isActive = true;
    
    this.init();
  }

  init() {
    // Registra gli event listener per l'attività dell'utente
    document.addEventListener('mousemove', () => this.resetInactivityTimer());
    document.addEventListener('keypress', () => this.resetInactivityTimer());
    document.addEventListener('click', () => this.resetInactivityTimer());
    document.addEventListener('touchstart', () => this.resetInactivityTimer());
    document.addEventListener('scroll', () => this.resetInactivityTimer());

    // Inizia il timer di inattività
    this.resetInactivityTimer();

    // Inizia il heartbeat
    this.startHeartbeat();

    // Monitora la visibilità della pagina
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseHeartbeat();
      } else {
        this.resumeHeartbeat();
      }
    });

    console.log('SessionManager initialized');
  }

  resetInactivityTimer() {
    clearTimeout(this.inactivityTimer);
    this.isActive = true;

    this.inactivityTimer = setTimeout(() => {
      this.isActive = false;
      console.warn('Session timeout - User inactive for 30 minutes');
      this.handleSessionTimeout();
    }, this.SESSION_TIMEOUT);
  }

  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (this.isActive) {
        this.sendHeartbeat();
      }
    }, this.HEARTBEAT_INTERVAL);
  }

  pauseHeartbeat() {
    clearInterval(this.heartbeatTimer);
  }

  resumeHeartbeat() {
    this.startHeartbeat();
  }

  sendHeartbeat() {
    // Invia un ping al server per mantenere la sessione attiva
    fetch('/api/health', { method: 'GET' })
      .then(response => {
        if (!response.ok) {
          console.warn('Heartbeat failed:', response.status);
        }
      })
      .catch(error => {
        // Se il server non è raggiungibile, non è un errore critico
        console.log('Heartbeat offline mode:', error.message);
      });
  }

  handleSessionTimeout() {
    // Mostra un messaggio all'utente
    const message = 'La tua sessione è scaduta per inattività. Aggiorna la pagina per continuare.';
    
    // Tenta di mostrare una notifica
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Cosmic Navigator', {
        body: message,
        icon: '/assets/images/icon.png'
      });
    }

    // Log in console
    console.warn(message);

    // Opzionale: ricarica automaticamente la pagina dopo 5 minuti
    setTimeout(() => {
      console.log('Auto-reloading page due to session timeout');
      window.location.reload();
    }, 5 * 60 * 1000);
  }

  // Metodo per forzare un refresh della sessione
  refreshSession() {
    return fetch('/api/auth/me', { method: 'GET' })
      .then(response => {
        if (response.ok) {
          this.resetInactivityTimer();
          return true;
        }
        return false;
      })
      .catch(() => false);
  }
}

// Inizializza il Session Manager quando il DOM è pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.sessionManager = new SessionManager();
  });
} else {
  window.sessionManager = new SessionManager();
}
