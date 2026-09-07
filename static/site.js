// ========== CONFIGURAÇÃO DA API ==========
// Altere esta URL para o endereço da sua API externa
if (typeof window.API_URL === 'undefined') {
  window.API_URL = 'https://site-cronicas-api.onrender.com';
}
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  const API_URL = window.API_URL;
  const tokenInput = document.getElementById('tokenInput');
  const generateTokenButton = document.getElementById('generateToken');
  const copyTokenButton = document.getElementById('copyToken');
  const voteNumberInput = document.getElementById('votoNumero');
  const backgroundMedia = document.getElementById('backgroundAudio');
  const muteToggle = document.getElementById('muteToggle');

  const sendBackgroundCommand = (action) => {
    if (!backgroundMedia) return;
    const tag = backgroundMedia.tagName && backgroundMedia.tagName.toUpperCase();
    if (tag === 'IFRAME' && backgroundMedia.contentWindow) {
      backgroundMedia.contentWindow.postMessage(JSON.stringify({ event: 'command', func: action, args: [] }), 'https://www.youtube.com');
      return;
    }
    // For local audio element
    if (tag === 'AUDIO') {
      if (action === 'playVideo' || action === 'play') {
        backgroundMedia.play().catch(() => {});
      } else if (action === 'pauseVideo' || action === 'pause') {
        try { backgroundMedia.pause(); } catch (e) {}
      }
    }
  };

  const updateMuteButton = (muted) => {
    if (!muteToggle) return;
    muteToggle.dataset.muted = String(muted);
    muteToggle.setAttribute('aria-pressed', String(muted));
    muteToggle.textContent = muted ? 'Ativar música' : 'Mutar música';
  };

  const generateToken = async () => {
    if (!tokenInput) {
      return;
    }

    const length = Number(document.getElementById('tokenLength').value || 18);
    const upper = document.getElementById('tokenUpper').checked;
    const lower = document.getElementById('tokenLower').checked;
    const numbers = document.getElementById('tokenNumbers').checked;
    const symbols = document.getElementById('tokenSymbols').checked;

    if (!upper && !lower && !numbers && !symbols) {
      tokenInput.value = '';
      alert('Selecione pelo menos um tipo de caractere.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          length,
          upper,
          lower,
          numbers,
          symbols,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        tokenInput.value = '';
        alert(data.error || 'Não foi possível gerar o token.');
        return;
      }
      tokenInput.value = data.token;
    } catch (error) {
      tokenInput.value = '';
      alert('Não foi possível gerar o token.');
    }
  };

  if (generateTokenButton) {
    generateTokenButton.addEventListener('click', generateToken);
  }

  if (copyTokenButton && tokenInput) {
    copyTokenButton.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(tokenInput.value);
        copyTokenButton.textContent = 'Copiado';
        setTimeout(() => {
          copyTokenButton.textContent = 'Copiar';
        }, 1200);
      } catch (error) {
        copyTokenButton.textContent = 'Não foi possível copiar';
      }
    });
  }

  if (voteNumberInput) {
    document.querySelectorAll('[data-candidate-number]').forEach((button) => {
      button.addEventListener('click', () => {
        voteNumberInput.value = button.dataset.candidateNumber;
      });
    });
  }

  if (tokenInput) {
    generateToken();
  }

  if (backgroundMedia) {
    const requestPlayback = () => {
      const muted = window.localStorage.getItem('backgroundMusicMuted') === 'true';
      sendBackgroundCommand(muted || window.backgroundMusicDisabled ? 'pauseVideo' : 'playVideo');
      updateMuteButton(muted);
    };

    // iframe uses 'load', audio uses 'loadeddata'
    try {
      if (backgroundMedia.tagName.toUpperCase() === 'IFRAME') {
        backgroundMedia.addEventListener('load', requestPlayback);
      } else {
        backgroundMedia.addEventListener('loadeddata', requestPlayback);
      }
    } catch (e) {
      // ignore
    }

    // A first interaction lets browsers that block audible autoplay start playback.
    document.addEventListener('pointerdown', requestPlayback, { once: true });
    document.addEventListener('keydown', requestPlayback, { once: true });
  }

  if (muteToggle && backgroundMedia) {
    muteToggle.addEventListener('click', () => {
      const muted = window.localStorage.getItem('backgroundMusicMuted') === 'true';
      const nextMuted = !muted;
      window.localStorage.setItem('backgroundMusicMuted', String(nextMuted));
      sendBackgroundCommand(nextMuted || window.backgroundMusicDisabled ? 'pauseVideo' : 'playVideo');
      updateMuteButton(nextMuted);
    });

    updateMuteButton(window.localStorage.getItem('backgroundMusicMuted') === 'true');
  }
});
