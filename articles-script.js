// Articles functionality
class ArticlesManager {
    constructor() {
        this.articles = [];
        this.init();
    }

    init() {
        this.loadArticles();
        this.setupEventListeners();
        this.setupBackToTop();
    }

    async loadArticles() {
        try {
            // Load articles from articles.txt
            const response = await fetch('articles.txt');
            const text = await response.text();

            // Parse URLs from the text file
            const urls = text.split('\n')
                .map(line => line.trim())
                .filter(line => line && line.startsWith('http'));

            // Create article objects with metadata
            this.articles = urls.map((url, index) => {
                return {
                    id: index + 1,
                    url: url,
                    source: this.detectSource(url),
                    title: this.generateTitle(url, index),
                    date: '2025-07-01', // Default date, can be updated
                };
            });

            console.log('📰 Loaded articles:', this.articles);
            this.renderArticles();
        } catch (error) {
            console.error('❌ Error loading articles:', error);
            this.showError();
        }
    }

    detectSource(url) {
        if (url.includes('facebook.com')) return 'facebook';
        if (url.includes('focusonafrica.info')) return 'focusonafrica';
        if (url.includes('instagram.com')) return 'instagram';
        return 'web';
    }

    generateTitle(url, index) {
        const source = this.detectSource(url);

        const titles = {
            'focusonafrica': 'Rwanda: l\'inatteso dalla capitale a Bumazi - Focus on Africa',
            'facebook': `Storia del viaggio - Post Facebook ${index > 1 ? index - 1 : ''}`.trim()
        };

        return titles[source] || `Articolo ${index + 1}`;
    }

    getSourceLabel(source) {
        const labels = {
            'facebook': 'Facebook',
            'focusonafrica': 'Focus on Africa',
            'instagram': 'Instagram',
            'web': 'Web'
        };
        return labels[source] || 'Articolo';
    }

    renderArticles() {
        const grid = document.getElementById('articlesGrid');

        if (this.articles.length === 0) {
            grid.innerHTML = `
                <div class="loading-placeholder">
                    <i class="fas fa-newspaper"></i>
                    <p>Nessun articolo disponibile.</p>
                </div>
            `;
            return;
        }

        // Add loading state
        grid.innerHTML = `
            <div class="loading-placeholder">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Caricamento articoli...</p>
            </div>
        `;

        // Simulate loading delay for better UX
        setTimeout(() => {
            grid.innerHTML = '';

            this.articles.forEach((article, index) => {
                const articleCard = this.createArticleCard(article, index);
                grid.appendChild(articleCard);
            });

            // Animate items
            this.animateItems();
        }, 500);
    }

    createArticleCard(article, index) {
        const div = document.createElement('div');
        div.className = 'article-card';
        div.dataset.index = index;

        div.innerHTML = `
            <div class="article-preview">
                <iframe src="${article.url}" loading="lazy" sandbox="allow-same-origin"></iframe>
                <div class="article-preview-overlay">
                    <i class="fas fa-expand-alt"></i>
                </div>
            </div>
            <div class="article-content">
                <span class="article-source ${article.source}">${this.getSourceLabel(article.source)}</span>
                <h3 class="article-title">${article.title}</h3>
                <div class="article-meta">
                    <span class="article-date">
                        <i class="far fa-calendar"></i> ${this.formatDate(article.date)}
                    </span>
                    <span class="article-read-more">
                        Leggi <i class="fas fa-arrow-right"></i>
                    </span>
                </div>
            </div>
        `;

        // Add click handler
        div.addEventListener('click', () => this.openArticleModal(article));

        return div;
    }

    animateItems() {
        const items = document.querySelectorAll('.article-card');
        items.forEach((item, index) => {
            setTimeout(() => {
                item.style.animationDelay = `${index * 0.1}s`;
            }, 50);
        });
    }

    openArticleModal(article) {
        const modal = document.getElementById('articleModal');
        const iframe = document.getElementById('articleFrame');
        const externalLink = document.getElementById('articleExternalLink');

        // Set iframe source
        iframe.src = article.url;

        // Set external link
        externalLink.href = article.url;

        // Show modal
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    closeArticleModal() {
        const modal = document.getElementById('articleModal');
        const iframe = document.getElementById('articleFrame');

        // Clear iframe
        iframe.src = '';

        // Hide modal
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    setupEventListeners() {
        // Modal close button
        document.getElementById('articleModalClose').addEventListener('click', () => {
            this.closeArticleModal();
        });

        // Close modal when clicking outside
        document.getElementById('articleModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeArticleModal();
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (document.getElementById('articleModal').style.display === 'block') {
                if (e.key === 'Escape') {
                    this.closeArticleModal();
                }
            }
        });
    }

    setupBackToTop() {
        const backToTop = document.getElementById('backToTop');

        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        });
    }

    showError() {
        const grid = document.getElementById('articlesGrid');
        grid.innerHTML = `
            <div class="loading-placeholder">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Errore durante il caricamento degli articoli.</p>
            </div>
        `;
    }

    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('it-IT', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

// Initialize articles manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.articlesManager = new ArticlesManager();
});

// Export for external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ArticlesManager;
}
