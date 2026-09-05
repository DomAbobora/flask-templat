document.addEventListener('DOMContentLoaded', () => {
  const tokenInput = document.getElementById('tokenInput');
  const generateTokenButton = document.getElementById('generateToken');
  const copyTokenButton = document.getElementById('copyToken');
  const voteNumberInput = document.getElementById('votoNumero');
  const youtubeAudio = document.getElementById('youtubeAudio');
  const muteToggle = document.getElementById('muteToggle');

  const sendYouTubeCommand = (func) => {
    if (!youtubeAudio || !youtubeAudio.contentWindow) return;
    youtubeAudio.contentWindow.postMessage(JSON.stringify({
      event: 'command',
      func,
      args: [],
    }), 'https://www.youtube.com');
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
      const response = await fetch('/api/tokens', {
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

  if (youtubeAudio) {
    const requestPlayback = () => {
      const muted = window.localStorage.getItem('backgroundMusicMuted') === 'true';
      sendYouTubeCommand(muted || window.backgroundMusicDisabled ? 'pauseVideo' : 'playVideo');
      updateMuteButton(muted);
    };

    youtubeAudio.addEventListener('load', requestPlayback);
    // A first interaction lets browsers that block audible autoplay start playback.
    document.addEventListener('pointerdown', requestPlayback, { once: true });
    document.addEventListener('keydown', requestPlayback, { once: true });
  }

  if (muteToggle && youtubeAudio) {
    muteToggle.addEventListener('click', () => {
      const muted = window.localStorage.getItem('backgroundMusicMuted') === 'true';
      const nextMuted = !muted;
      window.localStorage.setItem('backgroundMusicMuted', String(nextMuted));
      sendYouTubeCommand(nextMuted || window.backgroundMusicDisabled ? 'pauseVideo' : 'playVideo');
      updateMuteButton(nextMuted);
    });

    updateMuteButton(window.localStorage.getItem('backgroundMusicMuted') === 'true');
  }
});
