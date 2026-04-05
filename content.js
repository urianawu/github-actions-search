(() => {
    'use strict';

    const SEARCH_CONTAINER_ID = 'gha-search-container';
    const SEARCH_INPUT_ID = 'gha-search-input';

    // All workflows loaded from all pages (name + href)
    let allWorkflows = [];

    function findWorkflowList() {
        const item = document.querySelector('li[data-test-selector="workflow-rendered"]');
        return item ? item.closest('ul') : null;
    }

    function collectVisibleWorkflows(list) {
        const items = list.querySelectorAll('li[data-test-selector="workflow-rendered"]');
        const workflows = [];
        for (const li of items) {
            const a = li.querySelector('a');
            if (a) {
                workflows.push({ name: a.textContent.trim(), href: a.getAttribute('href') });
            }
        }
        return workflows;
    }

    async function loadAllWorkflows(list) {
        // Start with what's already in the DOM
        allWorkflows = collectVisibleWorkflows(list);

        const showMoreDiv = list.parentElement?.querySelector(
            'div[data-action*="nav-list-group#showMore"]',
        );
        if (!showMoreDiv) return;

        const baseUrl = showMoreDiv.getAttribute('src');
        const totalPages = parseInt(showMoreDiv.getAttribute('data-total-pages'), 10);
        const currentPage = parseInt(showMoreDiv.getAttribute('data-current-page'), 10);

        if (!baseUrl || !totalPages || !currentPage || currentPage >= totalPages) return;

        // Fetch remaining pages in parallel
        const fetches = [];
        for (let page = currentPage + 1; page <= totalPages; page++) {
            const url = `${baseUrl}&page=${page}`;
            fetches.push(
                fetch(url, {
                    headers: { Accept: 'text/html', 'X-Requested-With': 'XMLHttpRequest' },
                })
                    .then((r) => (r.ok ? r.text() : ''))
                    .catch(() => ''),
            );
        }

        const pages = await Promise.all(fetches);

        for (const html of pages) {
            if (!html) continue;
            const template = document.createElement('template');
            template.innerHTML = html;
            const items = template.content.querySelectorAll(
                'li[data-test-selector="workflow-rendered"]',
            );
            for (const li of items) {
                const a = li.querySelector('a');
                if (a) {
                    allWorkflows.push({
                        name: a.textContent.trim(),
                        href: a.getAttribute('href'),
                    });
                }
            }
        }
    }

    function injectSearchBar(list) {
        if (document.getElementById(SEARCH_CONTAINER_ID)) return;

        const container = document.createElement('div');
        container.id = SEARCH_CONTAINER_ID;

        const input = document.createElement('input');
        input.id = SEARCH_INPUT_ID;
        input.type = 'text';
        input.placeholder = 'Filter workflows\u2026';
        input.setAttribute('autocomplete', 'off');
        input.setAttribute('spellcheck', 'false');

        const resultsBox = document.createElement('ul');
        resultsBox.id = 'gha-search-results';

        input.addEventListener('input', () => {
            const query = input.value.toLowerCase().trim();
            if (!query) {
                resultsBox.style.display = 'none';
                resultsBox.innerHTML = '';
                // Show original list
                list.style.display = '';
                const showMore = list.parentElement?.querySelector(
                    'div[data-action*="nav-list-group#showMore"]',
                );
                if (showMore) showMore.style.display = '';
                return;
            }

            // Hide original list, show filtered results
            list.style.display = 'none';
            const showMore = list.parentElement?.querySelector(
                'div[data-action*="nav-list-group#showMore"]',
            );
            if (showMore) showMore.style.display = 'none';

            const matches = allWorkflows.filter((w) => w.name.toLowerCase().includes(query));

            resultsBox.innerHTML = '';
            for (const w of matches) {
                const li = document.createElement('li');
                li.className = 'ActionListItem';
                const a = document.createElement('a');
                a.className = 'ActionListContent';
                a.href = w.href;
                a.setAttribute('data-turbo-frame', 'repo-content-turbo-frame');
                const span = document.createElement('span');
                span.className = 'ActionListItem-label ActionListItem-label--truncate';
                span.textContent = w.name;
                a.appendChild(span);
                li.appendChild(a);
                resultsBox.appendChild(li);
            }
            resultsBox.style.display = '';
        });

        document.addEventListener('keydown', (e) => {
            const searchInput = document.getElementById(SEARCH_INPUT_ID);
            if (!searchInput) return;

            if (e.key === '/' && !isInputFocused()) {
                e.preventDefault();
                searchInput.focus();
            }
            if (e.key === 'Escape' && document.activeElement === searchInput) {
                searchInput.value = '';
                searchInput.dispatchEvent(new Event('input'));
                searchInput.blur();
            }
        });

        container.appendChild(input);
        container.appendChild(resultsBox);
        resultsBox.style.display = 'none';

        // Insert before the <ul> list
        list.parentElement.insertBefore(container, list);

        // Silently fetch all workflow names from remaining pages
        loadAllWorkflows(list);
    }

    function isInputFocused() {
        const el = document.activeElement;
        if (!el) return false;
        const tag = el.tagName.toLowerCase();
        return (
            tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable
        );
    }

    function init() {
        const list = findWorkflowList();
        if (list) {
            injectSearchBar(list);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(init, 500));
    } else {
        setTimeout(init, 500);
    }

    const observer = new MutationObserver(() => {
        if (!window.location.pathname.includes('/actions')) return;
        if (!document.getElementById(SEARCH_CONTAINER_ID)) {
            setTimeout(init, 300);
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();
