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

  const generateToken = () => {
    if (!tokenInput) {
      return;
    }

    const length = Number(document.getElementById('tokenLength').value || 18);
    const upper = document.getElementById('tokenUpper').checked;
    const lower = document.getElementById('tokenLower').checked;
    const numbers = document.getElementById('tokenNumbers').checked;
    const symbols = document.getElementById('tokenSymbols').checked;

    const pool = [];
    if (upper) pool.push('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    if (lower) pool.push('abcdefghijklmnopqrstuvwxyz');
    if (numbers) pool.push('0123456789');
    if (symbols) pool.push('!@#$%&*');

    if (!pool.length) {
      tokenInput.value = '';
      return;
    }

    let result = '';
    for (let i = 0; i < length; i += 1) {
      const characters = pool[Math.floor(Math.random() * pool.length)];
      result += characters[Math.floor(Math.random() * characters.length)];
    }

    tokenInput.value = result;
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
