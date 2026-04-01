/**
 * Agile Intermediação — Multi-step Form Logic + Supabase Integration
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('intakeForm');
    const steps = document.querySelectorAll('.form-step');
    const dots = document.querySelectorAll('.step-dot');
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    const submitBtn = document.getElementById('submitBtn');
    const errorBanner = document.getElementById('formErrorBanner');
    const errorMessage = document.getElementById('formErrorMessage');

    let currentStep = 1;

    // =========================================
    // 1. CAPTURA DE UTMs E SOURCE PAGE
    // =========================================

    function captureTrackingData() {
        const params = new URLSearchParams(window.location.search);

        document.getElementById('utmSource').value = params.get('utm_source') || '';
        document.getElementById('utmMedium').value = params.get('utm_medium') || '';
        document.getElementById('utmCampaign').value = params.get('utm_campaign') || '';

        // Guardar a página de origem (referrer ou param "from")
        const fromParam = params.get('from');
        document.getElementById('sourcePage').value = fromParam || document.referrer || 'direto';
    }

    captureTrackingData();

    // =========================================
    // 2. STEP NAVIGATION
    // =========================================

    function updateStep() {
        steps.forEach(step => {
            step.classList.toggle('active', parseInt(step.dataset.step) === currentStep);
        });

        dots.forEach(dot => {
            const stepNum = parseInt(dot.dataset.step);
            dot.classList.toggle('active', stepNum === currentStep);
            dot.classList.toggle('completed', stepNum < currentStep);
        });

        prevBtn.style.display = currentStep > 1 ? 'block' : 'none';

        if (currentStep === steps.length) {
            nextBtn.style.display = 'none';
            submitBtn.style.display = 'block';
        } else {
            nextBtn.style.display = 'block';
            submitBtn.style.display = 'none';
        }

        // Limpar banner de erro ao mudar de passo
        hideErrorBanner();
    }

    nextBtn.addEventListener('click', () => {
        if (validateCurrentStep()) {
            currentStep++;
            updateStep();
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentStep > 1) {
            currentStep--;
            updateStep();
        }
    });

    // =========================================
    // 3. VALIDAÇÃO
    // =========================================

    const validators = {
        email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        phone: (value) => value.replace(/\D/g, '').length >= 10,
        processNumber: (value) => {
            // Formato CNJ flexível: aceita com ou sem pontuação
            const digits = value.replace(/\D/g, '');
            return digits.length >= 13 && digits.length <= 20;
        }
    };

    function showFieldError(fieldId, errorId) {
        const field = document.getElementById(fieldId);
        const error = document.getElementById(errorId);
        if (field) field.classList.add('error');
        if (error) error.classList.add('visible');
    }

    function clearFieldError(fieldId, errorId) {
        const field = document.getElementById(fieldId);
        const error = document.getElementById(errorId);
        if (field) field.classList.remove('error');
        if (error) error.classList.remove('visible');
    }

    function clearAllErrors() {
        document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
        document.querySelectorAll('.field-error.visible').forEach(el => el.classList.remove('visible'));
    }

    function showErrorBanner(msg) {
        errorMessage.textContent = msg;
        errorBanner.classList.add('visible');
    }

    function hideErrorBanner() {
        errorBanner.classList.remove('visible');
    }

    function validateCurrentStep() {
        clearAllErrors();
        let isValid = true;

        if (currentStep === 1) {
            const role = document.getElementById('userRole').value;
            const name = document.getElementById('userName').value.trim();

            if (!role) {
                showFieldError('userRole', 'userRoleError');
                isValid = false;
            }
            if (!name) {
                showFieldError('userName', 'userNameError');
                isValid = false;
            }
        }

        if (currentStep === 2) {
            const processNum = document.getElementById('processNumber').value.trim();

            if (!processNum) {
                showFieldError('processNumber', 'processNumberError');
                isValid = false;
            } else if (!validators.processNumber(processNum)) {
                document.getElementById('processNumberError').textContent = 'Formato de processo inválido. Verifique o número.';
                showFieldError('processNumber', 'processNumberError');
                isValid = false;
            }
        }

        if (currentStep === 4) {
            const email = document.getElementById('contactEmail').value.trim();
            const phone = document.getElementById('contactPhone').value.trim();
            const consent = document.getElementById('privacyConsent').checked;

            if (!email) {
                showFieldError('contactEmail', 'contactEmailError');
                isValid = false;
            } else if (!validators.email(email)) {
                document.getElementById('contactEmailError').textContent = 'Informe um e-mail válido.';
                showFieldError('contactEmail', 'contactEmailError');
                isValid = false;
            }

            if (!phone) {
                showFieldError('contactPhone', 'contactPhoneError');
                isValid = false;
            } else if (!validators.phone(phone)) {
                document.getElementById('contactPhoneError').textContent = 'Informe um telefone válido (mínimo 10 dígitos).';
                showFieldError('contactPhone', 'contactPhoneError');
                isValid = false;
            }

            if (!consent) {
                document.getElementById('consentGroup').classList.add('error');
                document.getElementById('consentError').classList.add('visible');
                isValid = false;
            }
        }

        return isValid;
    }

    // =========================================
    // 4. SUBMISSÃO AO SUPABASE
    // =========================================

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!validateCurrentStep()) return;

        // Activar loading state
        submitBtn.innerHTML = '<span class="spinner"></span> Enviando...';
        form.classList.add('form-loading');
        hideErrorBanner();

        try {
            // Recolher dados do formulário
            const formData = {
                lead: {
                    full_name: document.getElementById('userName').value.trim(),
                    email: document.getElementById('contactEmail').value.trim(),
                    phone: document.getElementById('contactPhone').value.trim(),
                    lead_type: document.getElementById('userRole').value,
                    source_page: document.getElementById('sourcePage').value,
                    utm_source: document.getElementById('utmSource').value || null,
                    utm_medium: document.getElementById('utmMedium').value || null,
                    utm_campaign: document.getElementById('utmCampaign').value || null,
                    notes: document.getElementById('notes').value.trim() || null,
                    privacy_consent: true,
                    privacy_consent_at: new Date().toISOString(),
                    status: 'novo'
                },
                case_data: {
                    asset_type: 'trabalhista',
                    process_number: document.getElementById('processNumber').value.trim(),
                    tribunal: document.getElementById('tribunal').value || null,
                    court_region: document.getElementById('tribunal').value || null,
                    defendant_company: document.getElementById('defendantCompany').value.trim() || null,
                    estimated_value: parseFloat(document.getElementById('processValue').value) || null,
                    process_stage: document.getElementById('processStage').value || null,
                    case_status: 'recebido',
                    priority: 'media'
                }
            };

            // 1. Inserir lead
            const { data: leadData, error: leadError } = await supabase
                .from('leads')
                .insert(formData.lead)
                .select('id')
                .single();

            if (leadError) throw new Error('Erro ao criar lead: ' + leadError.message);

            const leadId = leadData.id;

            // 2. Inserir case vinculado ao lead
            const { data: caseData, error: caseError } = await supabase
                .from('cases')
                .insert({ ...formData.case_data, lead_id: leadId })
                .select('id, internal_reference')
                .single();

            if (caseError) throw new Error('Erro ao criar caso: ' + caseError.message);

            // 3. Inserir log de atividade
            const { error: logError } = await supabase
                .from('activity_logs')
                .insert({
                    lead_id: leadId,
                    case_id: caseData.id,
                    event_type: 'formulario_submetido',
                    description: `Formulário de análise submetido por ${formData.lead.full_name} (${formData.lead.lead_type})`,
                    actor_type: 'cliente'
                });

            if (logError) {
                console.warn('Aviso: falha ao gravar log de atividade:', logError.message);
            }

            // 4. Redirecionar para página de sucesso
            const ref = encodeURIComponent(caseData.internal_reference);
            const email = encodeURIComponent(formData.lead.email);
            window.location.href = `sucesso.html?ref=${ref}&email=${email}`;

        } catch (error) {
            console.error('Erro na submissão:', error);
            form.classList.remove('form-loading');
            submitBtn.innerHTML = 'Enviar para Análise';
            showErrorBanner(
                error.message || 'Ocorreu um erro ao enviar os dados. Tente novamente.'
            );
        }
    });

    // =========================================
    // 5. INPUT MASKS (telefone)
    // =========================================

    const phoneInput = document.getElementById('contactPhone');
    phoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) value = value.slice(0, 11);

        if (value.length > 6) {
            value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
        } else if (value.length > 2) {
            value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
        } else if (value.length > 0) {
            value = `(${value}`;
        }

        e.target.value = value;
    });

    // Máscara para número de processo CNJ
    const processInput = document.getElementById('processNumber');
    processInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 20) value = value.slice(0, 20);

        // Formato: NNNNNNN-DD.AAAA.J.TT.OOOO
        if (value.length > 13) {
            value = `${value.slice(0, 7)}-${value.slice(7, 9)}.${value.slice(9, 13)}.${value.slice(13, 14)}.${value.slice(14, 16)}.${value.slice(16)}`;
        } else if (value.length > 9) {
            value = `${value.slice(0, 7)}-${value.slice(7, 9)}.${value.slice(9)}`;
        } else if (value.length > 7) {
            value = `${value.slice(0, 7)}-${value.slice(7)}`;
        }

        e.target.value = value;
    });

    // Limpar erros ao digitar
    document.querySelectorAll('input, select, textarea').forEach(field => {
        field.addEventListener('input', () => {
            field.classList.remove('error');
            const errorEl = field.parentElement.querySelector('.field-error');
            if (errorEl) errorEl.classList.remove('visible');
        });
    });

    document.getElementById('privacyConsent').addEventListener('change', () => {
        document.getElementById('consentGroup').classList.remove('error');
        document.getElementById('consentError').classList.remove('visible');
    });
});
