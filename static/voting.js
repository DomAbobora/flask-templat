document.addEventListener('DOMContentLoaded', () => {
  window.backgroundMusicDisabled = true;

  // Dados dos candidatos
  const candidatesData = {
    presidencia: {
      '13': {
        party: 'PT',
        name: 'Suika / Yuugi',
        images: [
          "{{ url_for('static', filename='suika.png') }}",
          "{{ url_for('static', filename='yuugi.png') }}"
        ]
      },
      '14': {
        party: 'Missão',
        name: 'Miko / Shou',
        images: [
          "{{ url_for('static', filename='miko.png') }}",
          "{{ url_for('static', filename='shou.png') }}"
        ]
      },
      '22': {
        party: 'PL',
        name: 'Reimu / Marisa',
        images: [
          "{{ url_for('static', filename='reimu-marisa.png') }}"
        ]
      }
    },
    governador: {
      '1399': {
        party: 'PT',
        name: 'Cirno, Sunny Milk, Star Sapphire, Luna Child',
        images: [
          "{{ url_for('static', filename='cirno-sunny-star-luna.png') }}",
          "{{ url_for('static', filename='governador-pt.png') }}"
        ]
      },
      '1400': {
        party: 'Missão',
        name: 'Clownpiece',
        images: [
          "{{ url_for('static', filename='clownpiece.png') }}"
        ]
      },
      '2222': {
        party: 'PL',
        name: 'Suwako',
        images: [
          "{{ url_for('static', filename='suwako.png') }}"
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

  let usedTokens = new Set();
  let currentVoterData = {};
  let voteStageName = 'presidencia';
  let presidentialVote = '';

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
      candidatePreview.hidden = false;
      renderCandidatePreview(candidatePreview, number);
    } else {
      candidatePreview.hidden = true;
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
    proceedVoting.addEventListener('click', () => {
      const nome = nomeEleitor.value.trim();
      const token = tokenInput.value.trim();

      if (!nome || !token) {
        alert('Por favor, preencha o nome e gere um token');
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
    confirmRegistro.addEventListener('click', () => {
      const nome = nomeRegistro.value.trim();
      const token = tokenRegistro.value.trim();

      if (!nome || !token) {
        alert('Por favor, preencha os campos');
        return;
      }

      // Verificar se token já foi usado
      if (usedTokens.has(token)) {
        alert('Este token já foi utilizado. Acesso negado.');
        tokenRegistro.value = '';
        nomeRegistro.value = '';
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
          candidatePreview.hidden = true;
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
          body: JSON.stringify({ presidencia: presidentialVote, governador: voto }),
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
      if (!response.ok) {
        alert('Não foi possível registrar o voto.');
        return;
      }

      // Registrar que este token foi usado após a confirmação do servidor.
      usedTokens.add(currentVoterData.token);

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

  if (limparVoto) {
    limparVoto.addEventListener('click', () => {
      votoNumero.value = '';
      if (candidatePreview) {
        candidatePreview.innerHTML = '';
        candidatePreview.hidden = true;
      }
    });
  }

  if (corrigirVoto) {
    corrigirVoto.addEventListener('click', () => {
      votoNumero.value = '';
      if (candidatePreview) {
        candidatePreview.innerHTML = '';
        candidatePreview.hidden = true;
      }
      showSection('urna');
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

  // Suporte a entrada numérica na urna
  if (votoNumero) {
    document.addEventListener('keydown', (e) => {
      if (sections.urna.style.display !== 'none' && /^\d$/.test(e.key)) {
        votoNumero.value += e.key;
        playUrnaAudio(urnaTeclaAudio);
        updateCandidatePreview(votoNumero.value);
      }
    });
  }

});
