(function () {
    const TOKEN_KEY = 'api-port-russel-token';
    const USER_KEY = 'api-port-russel-user';
    const page = document.body.dataset.page;

    function getToken() {
        return localStorage.getItem(TOKEN_KEY) || '';
    }

    function getStoredUser() {
        try {
            return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
        } catch (error) {
            return null;
        }
    }

    function setSession(token, user) {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    }

    function clearSession() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    }

    function redirectToHome() {
        window.location.href = '/';
    }

    function redirectToDashboard() {
        window.location.href = '/dashboard.html';
    }

    function requireAuth() {
        if (!getToken()) {
            redirectToHome();
            return false;
        }
        return true;
    }

    function formatDate(value) {
        if (!value) {
            return 'n/a';
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return date.toLocaleString('fr-FR');
    }

    function toLocalDateTimeValue(value) {
        if (!value) {
            return '';
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return '';
        }

        const pad = (number) => String(number).padStart(2, '0');
        return date.getFullYear() + '-'
            + pad(date.getMonth() + 1) + '-'
            + pad(date.getDate()) + 'T'
            + pad(date.getHours()) + ':'
            + pad(date.getMinutes());
    }

    async function apiFetch(url, options) {
        const requestOptions = Object.assign({ headers: {} }, options || {});
        requestOptions.headers = Object.assign({}, requestOptions.headers);

        if (!(requestOptions.body instanceof FormData) && !requestOptions.headers['Content-Type'] && requestOptions.body) {
            requestOptions.headers['Content-Type'] = 'application/json';
        }

        const token = getToken();
        if (token) {
            requestOptions.headers.Authorization = 'Bearer ' + token;
        }

        const response = await fetch(url, requestOptions);
        let payload = null;
        const contentType = response.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
            payload = await response.json();
        } else {
            const text = await response.text();
            payload = text || null;
        }

        if (!response.ok) {
            const message = payload && payload.message ? payload.message : 'Erreur requete';
            throw new Error(message);
        }

        return payload;
    }

    function bindLogoutButton() {
        const button = document.getElementById('logoutButton');
        if (!button) {
            return;
        }

        button.addEventListener('click', function () {
            clearSession();
            redirectToHome();
        });
    }

    function setMessage(element, message, isSuccess) {
        if (!element) {
            return;
        }

        element.textContent = message || '';
        element.classList.toggle('success', Boolean(isSuccess));
    }

    function renderEmpty(container, message) {
        container.innerHTML = '<div class="empty-state">' + message + '</div>';
    }

    function entityMeta(items) {
        return '<div class="entity-meta">' + items.map((item) => '<span>' + item + '</span>').join('') + '</div>';
    }

    function renderUsers(container, users) {
        if (!Array.isArray(users) || !users.length) {
            renderEmpty(container, 'Aucun utilisateur a afficher.');
            return;
        }

        container.innerHTML = users.map((user) => {
            return '<article class="entity-card">'
                + '<header><h3>' + user.name + '</h3><code>' + user._id + '</code></header>'
                + entityMeta([user.email, 'role: ' + (user.role || 'user'), 'cree le ' + formatDate(user.createdAt)])
                + '<div class="entity-actions">'
                + '<button type="button" data-user-fill="' + user._id + '">Pre-remplir edition</button>'
                + '<button type="button" class="danger-button" data-user-delete="' + user._id + '">Supprimer</button>'
                + '</div>'
                + '</article>';
        }).join('');
    }

    function renderCatways(container, catways) {
        if (!Array.isArray(catways) || !catways.length) {
            renderEmpty(container, 'Aucun catway a afficher.');
            return;
        }

        container.innerHTML = catways.map((catway) => {
            return '<article class="entity-card">'
                + '<header><h3>Catway ' + catway.catwayNumber + '</h3><strong>' + catway.catwayType + '</strong></header>'
                + entityMeta(['etat: ' + catway.catwayState])
                + '<div class="entity-actions">'
                + '<button type="button" data-catway-fill="' + catway.catwayNumber + '">Pre-remplir edition</button>'
                + '<button type="button" class="danger-button" data-catway-delete="' + catway.catwayNumber + '">Supprimer</button>'
                + '</div>'
                + '</article>';
        }).join('');
    }

    function renderReservations(container, reservations) {
        if (!Array.isArray(reservations) || !reservations.length) {
            renderEmpty(container, 'Aucune reservation a afficher.');
            return;
        }

        container.innerHTML = reservations.map((reservation) => {
            return '<article class="entity-card">'
                + '<header><h3>' + reservation.clientName + ' / ' + reservation.boatName + '</h3><code>' + reservation._id + '</code></header>'
                + entityMeta([
                    'catway ' + reservation.catwayNumber,
                    'debut: ' + formatDate(reservation.startDate),
                    'fin: ' + formatDate(reservation.endDate)
                ])
                + '<div class="entity-actions">'
                + '<button type="button" data-reservation-fill="' + reservation._id + '">Pre-remplir edition</button>'
                + '<button type="button" class="danger-button" data-reservation-delete="' + reservation._id + '">Supprimer</button>'
                + '</div>'
                + '</article>';
        }).join('');
    }

    function initHomePage() {
        const loginForm = document.getElementById('loginForm');
        const globalMessage = document.getElementById('globalMessage');

        if (getToken()) {
            redirectToDashboard();
            return;
        }

        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            try {
                const formData = new FormData(loginForm);
                const result = await apiFetch('/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({
                        email: formData.get('email'),
                        password: formData.get('password')
                    })
                });

                setSession(result.token, result.user);
                setMessage(globalMessage, 'Connexion reussie. Redirection...', true);
                window.setTimeout(redirectToDashboard, 300);
            } catch (error) {
                clearSession();
                setMessage(globalMessage, error.message, false);
            }
        });
    }

    function initDashboardPage() {
        if (!requireAuth()) {
            return;
        }

        bindLogoutButton();
        const authStatus = document.getElementById('authStatus');
        const dashboardUserEmail = document.getElementById('dashboardUserEmail');
        const dashboardToday = document.getElementById('dashboardToday');
        const ongoingReservationsList = document.getElementById('ongoingReservationsList');
        const refreshDashboardButton = document.getElementById('refreshDashboardButton');
        const globalMessage = document.getElementById('globalMessage');
        const user = getStoredUser();

        authStatus.textContent = 'Connecte';
        dashboardUserEmail.textContent = user && user.email ? user.email : 'Utilisateur inconnu';
        dashboardToday.textContent = new Date().toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        async function loadOngoingReservations() {
            try {
                const reservations = await apiFetch('/reservations');
                const now = new Date();
                const currentReservations = reservations.filter((reservation) => {
                    return new Date(reservation.startDate) <= now && new Date(reservation.endDate) >= now;
                });
                renderReservations(ongoingReservationsList, currentReservations);
                setMessage(globalMessage, '', false);
            } catch (error) {
                renderEmpty(ongoingReservationsList, error.message);
                setMessage(globalMessage, error.message, false);
            }
        }

        refreshDashboardButton.addEventListener('click', loadOngoingReservations);
        loadOngoingReservations();
    }

    function initUsersPage() {
        if (!requireAuth()) {
            return;
        }

        bindLogoutButton();
        const globalMessage = document.getElementById('globalMessage');
        const usersList = document.getElementById('usersList');
        const refreshUsersButton = document.getElementById('refreshUsersButton');
        const createUserForm = document.getElementById('createUserForm');
        const updateUserForm = document.getElementById('updateUserForm');

        async function refreshUsers() {
            try {
                const users = await apiFetch('/users');
                renderUsers(usersList, users);
            } catch (error) {
                renderEmpty(usersList, error.message);
                setMessage(globalMessage, error.message, false);
            }
        }

        createUserForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            try {
                const formData = new FormData(createUserForm);
                await apiFetch('/users', {
                    method: 'POST',
                    body: JSON.stringify({
                        name: formData.get('name'),
                        email: formData.get('email'),
                        password: formData.get('password'),
                        role: formData.get('role') || 'user'
                    })
                });
                createUserForm.reset();
                setMessage(globalMessage, 'Utilisateur cree.', true);
                refreshUsers();
            } catch (error) {
                setMessage(globalMessage, error.message, false);
            }
        });

        updateUserForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            try {
                const formData = new FormData(updateUserForm);
                const payload = {};
                ['name', 'email', 'password', 'role'].forEach((key) => {
                    const value = formData.get(key);
                    if (value) {
                        payload[key] = value;
                    }
                });
                await apiFetch('/users/' + encodeURIComponent(formData.get('id')), {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });
                setMessage(globalMessage, 'Utilisateur mis a jour.', true);
                refreshUsers();
            } catch (error) {
                setMessage(globalMessage, error.message, false);
            }
        });

        refreshUsersButton.addEventListener('click', refreshUsers);
        usersList.addEventListener('click', async (event) => {
            const fillButton = event.target.closest('[data-user-fill]');
            const deleteButton = event.target.closest('[data-user-delete]');

            if (fillButton) {
                try {
                    const user = await apiFetch('/users/' + encodeURIComponent(fillButton.getAttribute('data-user-fill')));
                    updateUserForm.elements.id.value = user._id;
                    updateUserForm.elements.name.value = user.name || '';
                    updateUserForm.elements.email.value = user.email || '';
                    updateUserForm.elements.password.value = '';
                    updateUserForm.elements.role.value = '';
                    setMessage(globalMessage, 'Formulaire utilisateur pre-rempli.', true);
                } catch (error) {
                    setMessage(globalMessage, error.message, false);
                }
            }

            if (deleteButton) {
                if (!window.confirm('Supprimer cet utilisateur ?')) {
                    return;
                }
                try {
                    await apiFetch('/users/' + encodeURIComponent(deleteButton.getAttribute('data-user-delete')), { method: 'DELETE' });
                    setMessage(globalMessage, 'Utilisateur supprime.', true);
                    refreshUsers();
                } catch (error) {
                    setMessage(globalMessage, error.message, false);
                }
            }
        });

        refreshUsers();
    }

    function initCatwaysPage() {
        if (!requireAuth()) {
            return;
        }

        bindLogoutButton();
        const globalMessage = document.getElementById('globalMessage');
        const catwaysList = document.getElementById('catwaysList');
        const refreshCatwaysButton = document.getElementById('refreshCatwaysButton');
        const createCatwayForm = document.getElementById('createCatwayForm');
        const updateCatwayForm = document.getElementById('updateCatwayForm');

        async function refreshCatways() {
            try {
                const catways = await apiFetch('/catways');
                renderCatways(catwaysList, catways);
            } catch (error) {
                renderEmpty(catwaysList, error.message);
                setMessage(globalMessage, error.message, false);
            }
        }

        createCatwayForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            try {
                const formData = new FormData(createCatwayForm);
                await apiFetch('/catways', {
                    method: 'POST',
                    body: JSON.stringify({
                        catwayNumber: Number(formData.get('catwayNumber')),
                        catwayType: formData.get('catwayType'),
                        catwayState: formData.get('catwayState')
                    })
                });
                createCatwayForm.reset();
                setMessage(globalMessage, 'Catway cree.', true);
                refreshCatways();
            } catch (error) {
                setMessage(globalMessage, error.message, false);
            }
        });

        updateCatwayForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            try {
                const formData = new FormData(updateCatwayForm);
                const payload = {};
                ['catwayType', 'catwayState'].forEach((key) => {
                    const value = formData.get(key);
                    if (value) {
                        payload[key] = value;
                    }
                });
                await apiFetch('/catways/' + encodeURIComponent(formData.get('catwayNumber')), {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });
                setMessage(globalMessage, 'Catway mis a jour.', true);
                refreshCatways();
            } catch (error) {
                setMessage(globalMessage, error.message, false);
            }
        });

        refreshCatwaysButton.addEventListener('click', refreshCatways);
        catwaysList.addEventListener('click', async (event) => {
            const fillButton = event.target.closest('[data-catway-fill]');
            const deleteButton = event.target.closest('[data-catway-delete]');

            if (fillButton) {
                try {
                    const catway = await apiFetch('/catways/' + encodeURIComponent(fillButton.getAttribute('data-catway-fill')));
                    updateCatwayForm.elements.catwayNumber.value = catway.catwayNumber;
                    updateCatwayForm.elements.catwayType.value = catway.catwayType || '';
                    updateCatwayForm.elements.catwayState.value = catway.catwayState || '';
                    setMessage(globalMessage, 'Formulaire catway pre-rempli.', true);
                } catch (error) {
                    setMessage(globalMessage, error.message, false);
                }
            }

            if (deleteButton) {
                if (!window.confirm('Supprimer ce catway ?')) {
                    return;
                }
                try {
                    await apiFetch('/catways/' + encodeURIComponent(deleteButton.getAttribute('data-catway-delete')), { method: 'DELETE' });
                    setMessage(globalMessage, 'Catway supprime.', true);
                    refreshCatways();
                } catch (error) {
                    setMessage(globalMessage, error.message, false);
                }
            }
        });

        refreshCatways();
    }

    function initReservationsPage() {
        if (!requireAuth()) {
            return;
        }

        bindLogoutButton();
        const globalMessage = document.getElementById('globalMessage');
        const reservationsList = document.getElementById('reservationsList');
        const refreshReservationsButton = document.getElementById('refreshReservationsButton');
        const reservationCatwayFilter = document.getElementById('reservationCatwayFilter');
        const createReservationForm = document.getElementById('createReservationForm');
        const updateReservationForm = document.getElementById('updateReservationForm');

        async function refreshReservations() {
            try {
                const filter = reservationCatwayFilter.value.trim();
                const endpoint = filter ? '/reservations/catway/' + encodeURIComponent(filter) : '/reservations';
                const reservations = await apiFetch(endpoint);
                renderReservations(reservationsList, reservations);
            } catch (error) {
                renderEmpty(reservationsList, error.message);
                setMessage(globalMessage, error.message, false);
            }
        }

        createReservationForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            try {
                const formData = new FormData(createReservationForm);
                await apiFetch('/reservations', {
                    method: 'POST',
                    body: JSON.stringify({
                        catwayNumber: Number(formData.get('catwayNumber')),
                        clientName: formData.get('clientName'),
                        boatName: formData.get('boatName'),
                        startDate: new Date(formData.get('startDate')).toISOString(),
                        endDate: new Date(formData.get('endDate')).toISOString()
                    })
                });
                createReservationForm.reset();
                setMessage(globalMessage, 'Reservation creee.', true);
                refreshReservations();
            } catch (error) {
                setMessage(globalMessage, error.message, false);
            }
        });

        updateReservationForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            try {
                const formData = new FormData(updateReservationForm);
                const payload = {};
                const catwayNumber = formData.get('catwayNumber');
                if (catwayNumber) {
                    payload.catwayNumber = Number(catwayNumber);
                }
                ['clientName', 'boatName'].forEach((key) => {
                    const value = formData.get(key);
                    if (value) {
                        payload[key] = value;
                    }
                });
                ['startDate', 'endDate'].forEach((key) => {
                    const value = formData.get(key);
                    if (value) {
                        payload[key] = new Date(value).toISOString();
                    }
                });
                await apiFetch('/reservations/' + encodeURIComponent(formData.get('id')), {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });
                setMessage(globalMessage, 'Reservation mise a jour.', true);
                refreshReservations();
            } catch (error) {
                setMessage(globalMessage, error.message, false);
            }
        });

        refreshReservationsButton.addEventListener('click', refreshReservations);
        reservationCatwayFilter.addEventListener('change', refreshReservations);

        reservationsList.addEventListener('click', async (event) => {
            const fillButton = event.target.closest('[data-reservation-fill]');
            const deleteButton = event.target.closest('[data-reservation-delete]');

            if (fillButton) {
                try {
                    const reservation = await apiFetch('/reservations/' + encodeURIComponent(fillButton.getAttribute('data-reservation-fill')));
                    updateReservationForm.elements.id.value = reservation._id;
                    updateReservationForm.elements.catwayNumber.value = reservation.catwayNumber || '';
                    updateReservationForm.elements.clientName.value = reservation.clientName || '';
                    updateReservationForm.elements.boatName.value = reservation.boatName || '';
                    updateReservationForm.elements.startDate.value = toLocalDateTimeValue(reservation.startDate);
                    updateReservationForm.elements.endDate.value = toLocalDateTimeValue(reservation.endDate);
                    setMessage(globalMessage, 'Formulaire reservation pre-rempli.', true);
                } catch (error) {
                    setMessage(globalMessage, error.message, false);
                }
            }

            if (deleteButton) {
                if (!window.confirm('Supprimer cette reservation ?')) {
                    return;
                }
                try {
                    await apiFetch('/reservations/' + encodeURIComponent(deleteButton.getAttribute('data-reservation-delete')), { method: 'DELETE' });
                    setMessage(globalMessage, 'Reservation supprimee.', true);
                    refreshReservations();
                } catch (error) {
                    setMessage(globalMessage, error.message, false);
                }
            }
        });

        refreshReservations();
    }

    function initDocumentationPage() {
        if (!requireAuth()) {
            return;
        }

        bindLogoutButton();
    }

    switch (page) {
        case 'home':
            initHomePage();
            break;
        case 'dashboard':
            initDashboardPage();
            break;
        case 'users':
            initUsersPage();
            break;
        case 'catways':
            initCatwaysPage();
            break;
        case 'reservations':
            initReservationsPage();
            break;
        case 'documentation':
            initDocumentationPage();
            break;
        default:
            break;
    }
})();
