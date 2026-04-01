/**
 * Agile Intermediação - Internal Dashboard Logic
 */

const leads = [
    { id: 1, name: 'Dr. Roberto Silva', process: '0102145-88.2023.5.02.0001', role: 'Advogado', court: 'TRT-2 (SP)', value: 'R$ 450.000', status: 'pendente', date: '12/03/2026' },
    { id: 2, name: 'Maria Oliveira', process: '1000874-12.2022.5.15.0042', role: 'Reclamante', court: 'TRT-15 (Campinas)', value: 'R$ 82.000', status: 'aprovado', date: '11/03/2026' },
    { id: 3, name: 'Carlos Santos', process: '0011234-55.2021.5.01.0010', role: 'Reclamante', court: 'TRT-1 (RJ)', value: 'R$ 150.000', status: 'pendente', date: '11/03/2026' },
    { id: 4, name: 'Dra. Beatriz Costa', process: '0100552-33.2024.5.03.0021', role: 'Advogado', court: 'TRT-3 (MG)', value: 'R$ 1.200.000', status: 'aprovado', date: '10/03/2026' },
    { id: 5, name: 'Fernando Lima', process: '0000991-44.2023.5.04.0008', role: 'Reclamante', court: 'TRT-4 (RS)', value: 'R$ 45.000', status: 'pendente', date: '10/03/2026' }
];

document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('leadTableBody');
    const modal = document.getElementById('leadModal');
    const closeModal = document.getElementById('closeModal');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    // Populate Table
    function renderLeads() {
        tableBody.innerHTML = leads.map(lead => `
            <tr>
                <td>
                    <div style="font-weight: 600;">${lead.name}</div>
                    <div class="text-muted" style="font-size: 0.8rem;">${lead.process}</div>
                </td>
                <td><span class="badge ${lead.role === 'Advogado' ? 'badge-lawyer' : ''}">${lead.role}</span></td>
                <td>${lead.court}</td>
                <td class="text-gold">${lead.value}</td>
                <td><span class="badge badge-${lead.status}">${lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}</span></td>
                <td>
                    <button class="btn btn-outline btn-sm view-details" data-id="${lead.id}" style="padding: 0.3rem 0.8rem; font-size: 0.8rem;">Ver</button>
                </td>
            </tr>
        `).join('');

        // Re-attach event listeners
        document.querySelectorAll('.view-details').forEach(btn => {
            btn.addEventListener('click', () => openModal(btn.dataset.id));
        });
    }

    // Modal Logic
    function openModal(id) {
        const lead = leads.find(l => l.id == id);
        if (!lead) return;

        document.getElementById('modalName').textContent = lead.name;
        document.getElementById('modalProcess').textContent = lead.process;
        document.getElementById('modalRole').textContent = lead.role;
        document.getElementById('modalValue').textContent = lead.value;
        document.getElementById('modalDate').textContent = lead.date;

        modal.style.display = 'flex';
        // Reset tabs
        switchTab('info');
    }

    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });

    // Tab Logic
    function switchTab(tabId) {
        tabBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabId));
        tabContents.forEach(content => {
            content.classList.toggle('active', content.id === `tab-${tabId}`);
        });
    }

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    renderLeads();
});
