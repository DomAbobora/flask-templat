document.addEventListener('DOMContentLoaded', () => {
  window.backgroundMusicDisabled = true;

  // Dados dos candidatos
  const candidatesData = {
    presidencia: {
      '13': {
        party: 'PT',
        name: 'Suika / Yuugi',
        images: [
          "/static/suika.png",
          "/static/yuugi.png"
        ]
      },
      '14': {
        party: 'Missão',
        name: 'Miko / Shou',
        images: [
          "/static/miko.png",
          "/static/shou.png"
        ]
      },
      '22': {
        party: 'PL',
        name: 'Reimu / Marisa',
        images: [
          "/static/reimu-marisa.png"
        ]
      }
    },
    governador: {
      '1399': {
        party: 'PT',
        name: 'Cirno, Sunny Milk, Star Sapphire, Luna Child',
        images: [
          "/static/cirno-sunny-star-luna.png",
          "/static/governador-pt.png"
        ]
      },
      '1400': {
        party: 'Missão',
        name: 'Clownpiece',
        images: [
          "/static/clownpiece.png"
        ]
      },
      '2222': {
        party: 'PL',
        name: 'Suwako',
        images: [
          "/static/suwako.png"
        ]
      }
    }
  };

  const sections = {
    registro: document.getElementById('registroSecao'),
    fila: document.getElementById('filaSeccao'),
    banco: document.getElementById('bancoSecao'),
    urna: document.getElementById('urvnSecao'),
    confirmacao: document.getElementById('confirmacaoSecao'),
  };

  const tokenInput = document.getElementById('tokenInput');
  const lengthValue = document.getElementById('lengthValue');
  const tokenLength = document.getElementById('tokenLength');
  const nomeEleitor = document.getElementById('nomeEleitor');
  const votoNumero = document.getElementById('votoNumero');
  const nomeRegistro = document.getElementById('nomeRegistro');
  const tokenRegistro = document.getElementById('tokenRegistro');
  const backgroundAudio = document.getElementById('youtubeAudio');
  const urnaTeclaAudio = document.getElementById('urnaTeclaAudio');
  const urnaVotoAudio = document.getElementById('urnaVotoAudio');
  const candidatePreview = document.getElementById('candidatePreview');
  const voteStage = document.getElementById('voteStage');
  const presidenciaSection = document.getElementById('presidenciaSection');
  const governadorSection = document.getElementById('governadorSection');

  let currentVoterData = {};
  let voteStageName = 'presidencia';
  let presidentialVote = '';
  const validTokenPattern = /^[A-Za-z0-9!@#$%&*]{8,32}$/;

  const playUrnaAudio = (audio) => {
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  };

  const pauseBackgroundAudio = () => {
    if (!backgroundAudio || !backgroundAudio.contentWindow) return;
    backgroundAudio.contentWindow.postMessage(JSON.stringify({
      event: 'command',
      func: 'pauseVideo',
      args: [],
    }), 'https://www.youtube.com');
  };

  pauseBackgroundAudio();
  if (backgroundAudio) {
    backgroundAudio.addEventListener('load', pauseBackgroundAudio);
  }

  // Elementos de navegação
  const proceedVoting = document.getElementById('proceedVoting');
  const enterVoting = document.getElementById('enterVoting');
  const confirmRegistro = document.getElementById('confirmRegistro');
  const backToQueue = document.getElementById('backToQueue');
  const confirmarVoto = document.getElementById('confirmarVoto');
  const limparVoto = document.getElementById('limparVoto');
  const corrigirVoto = document.getElementById('corrigirVoto');
  const voltarAoInicio = document.getElementById('voltarAoInicio');
  const keypadButtons = document.querySelectorAll('.keypad-button');

  // Funções de navegação
  const showSection = (sectionName) => {
    Object.values(sections).forEach((section) => {
      if (section) section.style.display = 'none';
    });
    if (sections[sectionName]) {
      sections[sectionName].style.display = 'block';
    }
  };

  const renderCandidatePreview = (target, number) => {
    if (!target) return;
    
    const candidateInfo = candidatesData[voteStageName][number];
    
    if (!candidateInfo) {
      target.innerHTML = '<p>Chapa não encontrada. Confira o número digitado.</p>';
      return;
    }

    target.innerHTML = `
      <strong>${candidateInfo.party}</strong>
      <div class="candidate-preview-images">
        ${candidateInfo.images.map((image) => `<img src="${image}" alt="${candidateInfo.name}" />`).join('')}
      </div>
      <span>${candidateInfo.name}</span>
    `;
  };

  const updateCandidatePreview = (number) => {
    if (!candidatePreview) return;
    
    // Verifica se o número é válido
    const isValidNumber = candidatesData[voteStageName][number] !== undefined;
    
    // Só mostra o preview se o número for válido
    if (isValidNumber) {
      renderCandidatePreview(candidatePreview, number);
    } else {
      candidatePreview.innerHTML = '';
    }
  };

  // Atualizar display do length
  if (tokenLength) {
    tokenLength.addEventListener('input', (e) => {
      if (lengthValue) {
        lengthValue.textContent = e.target.value;
      }
    });
  }

  // Fluxo: Registro -> Fila -> Banco -> Urna -> Confirmação
  if (proceedVoting) {
    proceedVoting.addEventListener('click', async () => {
      const nome = nomeEleitor.value.trim();
      const token = tokenInput.value.trim();

      if (!nome || !token) {
        alert('Por favor, preencha o nome e gere um token');
        return;
      }

      // Registrar token como válido no servidor
      try {
        const response = await fetch('/api/register-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        if (response.status === 409) {
          alert('Este token já foi utilizado.');
          return;
        }

        if (!response.ok) {
          const errorData = await response.json();
          alert(errorData.error || 'Erro ao registrar token.');
          return;
        }
      } catch (error) {
        alert('Não foi possível conectar ao servidor.');
        return;
      }

      currentVoterData = { nome, token };
      showSection('fila');
    });
  }

  if (enterVoting) {
    enterVoting.addEventListener('click', () => {
      showSection('banco');
    });
  }

  if (confirmRegistro) {
    confirmRegistro.addEventListener('click', async () => {
      const nome = nomeRegistro.value.trim();
      const token = tokenRegistro.value.trim();

      if (!nome || !token) {
        alert('Por favor, preencha os campos');
        return;
      }

      if (!validTokenPattern.test(token)) {
        alert('O sábio eremita diz: coloque um token válido');
        tokenRegistro.value = '';
        return;
      }

      if (usedTokens.has(token)) {
        alert('Este token já foi utilizado. Acesso negado.');
        tokenRegistro.value = '';
        nomeRegistro.value = '';
        return;
      }

      let tokenResponse;
      try {
        tokenResponse = await fetch('/api/tokens/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
      } catch (error) {
        alert('Não foi possível validar o token com o servidor.');
        return;
      }
      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        alert(errorData.error || 'Token inválido.');
        return;
      }

      currentVoterData = { nome, token };
      // Garantir que começa com a seção de presidência visível
      voteStageName = 'presidencia';
      presidentialVote = '';
      if (presidenciaSection) presidenciaSection.style.display = 'block';
      if (governadorSection) governadorSection.style.display = 'none';
      showSection('urna');
    });
  }

  if (backToQueue) {
    backToQueue.addEventListener('click', () => {
      nomeRegistro.value = '';
      tokenRegistro.value = '';
      showSection('fila');
    });
  }

  if (confirmarVoto) {
    confirmarVoto.addEventListener('click', async () => {
      const voto = votoNumero.value.trim();

      if (!voto) {
        alert('Por favor, digite um número');
        return;
      }

      const validVote = candidatesData[voteStageName][voto] !== undefined;

      if (!validVote) {
        alert('Digite um número válido para esta etapa da votação.');
        return;
      }

      playUrnaAudio(urnaVotoAudio);

      if (voteStageName === 'presidencia') {
        presidentialVote = voto;
        voteStageName = 'governador';
        votoNumero.value = '';
        if (candidatePreview) {
          candidatePreview.innerHTML = '';
        }
        if (presidenciaSection) presidenciaSection.style.display = 'none';
        if (governadorSection) governadorSection.style.display = 'block';
        if (voteStage) voteStage.textContent = 'Etapa 2 de 2: escolha o Governador da Vila Humana.';
        return;
      }

      let response;
      try {
        response = await fetch('/api/votes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: currentVoterData.token,
            presidencia: presidentialVote,
            governador: voto,
          }),
        });
      } catch (error) {
        alert('Não foi possível conectar ao servidor de votação.');
        return;
      }
      if (response.status === 409) {
        const errorData = await response.json();
        alert(errorData.error);
        return;
      }
      if (response.status === 403) {
        const errorData = await response.json();
        alert(errorData.error);
        return;
      }
      if (response.status === 400) {
        const errorData = await response.json();
        alert(errorData.error);
        return;
      }
      if (!response.ok) {
        alert('Não foi possível registrar o voto.');
        return;
      }

      const votoData = {
        nome: currentVoterData.nome,
        token: currentVoterData.token,
        voto: { presidencia: presidentialVote, governador: voto },
        timestamp: new Date().toISOString(),
      };
      console.log('Voto registrado:', votoData);

      // Limpar dados
      votoNumero.value = '';
      nomeRegistro.value = '';
      tokenRegistro.value = '';
      nomeEleitor.value = '';
      tokenInput.value = '';

      showSection('confirmacao');
    });
  }

  if (corrigirVoto) {
    corrigirVoto.addEventListener('click', () => {
      votoNumero.value = '';
      if (candidatePreview) {
        candidatePreview.innerHTML = '';
      }
    });
  }

  if (voltarAoInicio) {
    voltarAoInicio.addEventListener('click', () => {
      voteStageName = 'presidencia';
      presidentialVote = '';
      if (presidenciaSection) presidenciaSection.style.display = 'block';
      if (governadorSection) governadorSection.style.display = 'none';
      if (voteStage) voteStage.textContent = 'Etapa 1 de 2: escolha o candidato à Presidência.';
      showSection('registro');
    });
  }

  // Inicializar mostrando a seção de registro
  showSection('registro');

  // Suporte aos botões do teclado numérico
  keypadButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const number = button.dataset.number;
      votoNumero.value += number;
      playUrnaAudio(urnaTeclaAudio);
      updateCandidatePreview(votoNumero.value);
    });
  });

});
