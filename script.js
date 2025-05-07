document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('currentYear').textContent = new Date().getFullYear();

    const header = document.querySelector('header');
    const stickyTitleElement = document.getElementById('sticky-section-title');
    const sections = Array.from(document.querySelectorAll('main section[data-section-title]'));
    const navLinks = document.querySelectorAll('header nav ul li a');
    
    let headerHeight = 0;
    let currentStickyTitle = "";
    
    function calculateHeaderHeight() {
        if (header) headerHeight = header.offsetHeight;
    }
    
    calculateHeaderHeight();
    window.addEventListener('resize', calculateHeaderHeight);

    function updateStickyHeaderAndNav() {
        if (!header) return;

        const scrollPosition = window.scrollY;
        let newActiveSectionId = null;
        let newActiveSectionTitle = "";

        for (let i = 0; i < sections.length; i++) {
            const section = sections[i];
            const sectionTop = section.offsetTop - headerHeight - 20; 
            const sectionBottom = sectionTop + section.offsetHeight;

            if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
                newActiveSectionTitle = section.getAttribute('data-section-title');
                newActiveSectionId = section.id;
                break; 
            }
        }
        
        if (!newActiveSectionId && sections.length > 0 && scrollPosition < sections[0].offsetTop - headerHeight) {
            newActiveSectionTitle = "";
        }

        if (stickyTitleElement && newActiveSectionTitle !== currentStickyTitle) {
            if (currentStickyTitle !== "") {
                stickyTitleElement.classList.remove('visible');
            }
            currentStickyTitle = newActiveSectionTitle;
            setTimeout(() => {
                stickyTitleElement.textContent = currentStickyTitle;
                if (currentStickyTitle !== "") {
                    stickyTitleElement.classList.add('visible');
                } else {
                    stickyTitleElement.classList.remove('visible');
                }
            }, currentStickyTitle === "" || stickyTitleElement.textContent === "" ? 0 : 150);
        }

        navLinks.forEach(link => {
            const linkHref = link.getAttribute('href');
            if (linkHref === `#${newActiveSectionId}`) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    window.addEventListener('scroll', updateStickyHeaderAndNav, { passive: true });
    updateStickyHeaderAndNav(); 

    const githubUsername = "ReNothingg"; 
    const reposContainer = document.getElementById('github-repos-container');
    const viewAllGithubLink = document.getElementById('view-all-github-link');

    if (viewAllGithubLink && githubUsername && githubUsername !== "ВАШ_GITHUB_USERNAME") {
        viewAllGithubLink.href = `https://github.com/${githubUsername}?tab=repositories`;
    } else if (viewAllGithubLink) {
         viewAllGithubLink.style.display = 'none';
    }

    async function fetchGitHubRepos() {
        const loadingTextElement = reposContainer ? reposContainer.querySelector('.loading-text') : null;

        if (!githubUsername || githubUsername === "ВАШ_GITHUB_USERNAME") {
            if (reposContainer) reposContainer.innerHTML = '<p class="error-text">GitHub username не указан.</p>';
            return;
        }
        
        const apiUrl = `https://api.github.com/users/${githubUsername}/repos?sort=pushed&direction=desc&per_page=6`;

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                let errorMsg = `Ошибка API: ${response.status}`;
                if (response.status === 403) errorMsg += " (Лимит запросов)";
                else if (response.status === 404) errorMsg += " (Пользователь не найден)";
                throw new Error(errorMsg);
            }
            const repos = await response.json();

            if (loadingTextElement) loadingTextElement.remove();
            if (!reposContainer) return;

            if (repos.length === 0) {
                reposContainer.innerHTML = '<p>Публичные репозитории отсутствуют.</p>';
                return;
            }

            repos.forEach(repo => {
                const repoCard = document.createElement('a');
                repoCard.classList.add('repo-card');
                repoCard.href = repo.html_url;
                repoCard.target = "_blank";
                repoCard.setAttribute('aria-label', `Репозиторий ${repo.name}`);

                repoCard.innerHTML = `
                    <div class="repo-card-content">
                        <h4>${escapeHtml(repo.name)}</h4>
                        <p class="repo-description">${repo.description ? escapeHtml(repo.description.substring(0, 90)) + (repo.description.length > 90 ? '...' : '') : '<i>Описание отсутствует.</i>'}</p>
                    </div>
                    <div class="repo-meta">
                        ${repo.language ? `<span class="repo-language"><span class="language-color-dot"></span> ${escapeHtml(repo.language)}</span>` : '<span class="repo-language"></span>'}
                        <span class="repo-stars">${repo.stargazers_count}</span>
                        <span class="repo-forks">Forks: ${repo.forks_count}</span>
                    </div>
                `;
                reposContainer.appendChild(repoCard);
            });

        } catch (error) {
            console.error("Ошибка загрузки GitHub репозиториев:", error);
            if (loadingTextElement) loadingTextElement.remove();
            if (reposContainer) reposContainer.innerHTML = `<p class="error-text">Не удалось загрузить репозитории. (${escapeHtml(error.message)})</p>`;
        }
    }

    function escapeHtml(unsafe) {
        if (unsafe === null || typeof unsafe === 'undefined') return '';
        return unsafe.toString()
             .replace(/&/g, "&")
             .replace(/</g, "<")
             .replace(/>/g, ">")
             .replace(/'/g, "'");
    }

    if (reposContainer) {
        fetchGitHubRepos();
    }
});