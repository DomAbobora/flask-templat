document.addEventListener('DOMContentLoaded', () => {
  const names = {
    presidencia: { 13: 'Suika / Yuugi', 14: 'Miko / Shou', 22: 'Reimu / Marisa' },
    governador: {
      1399: 'Cirno, Sunny Milk, Star Sapphire, Luna Child',
      1400: 'Clownpiece',
      2222: 'Suwako',
    },
  };

  const renderOffice = (target, officeResults, office) => {
    const total = Object.values(officeResults).reduce((sum, count) => sum + count, 0);
    target.innerHTML = Object.entries(names[office]).map(([number, name]) => {
      const count = officeResults[number] || 0;
      const percentage = total ? ((count / total) * 100).toFixed(1) : '0.0';
      return `<div class="result-row"><strong>${number} — ${name}</strong><span>${percentage}% (${count} voto${count === 1 ? '' : 's'})</span><div class="result-bar"><i style="width: ${percentage}%"></i></div></div>`;
    }).join('');
  };

  const loadResults = async () => {
    const response = await fetch('/api/results', { cache: 'no-store' });
    if (!response.ok) throw new Error('Não foi possível carregar os resultados.');
    const data = await response.json();
    renderOffice(document.getElementById('presidenciaResults'), data.presidencia, 'presidencia');
    renderOffice(document.getElementById('governadorResults'), data.governador, 'governador');
    document.getElementById('resultsStatus').textContent = `Atualizado às ${new Date().toLocaleTimeString('pt-BR')}`;
  };

  loadResults().catch((error) => {
    document.getElementById('resultsStatus').textContent = error.message;
  });
  window.setInterval(() => loadResults().catch(() => {}), 3000);
});
