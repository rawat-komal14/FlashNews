const BASE_URL = 'http://127.0.0.1:5001/api';
const newsGrid = document.getElementById('news-grid');
const searchInput = document.getElementById('search-input');
const sectionTitle = document.getElementById('section-title');
const bookmarkBtn = document.getElementById('show-bookmarks');
const quizModal = document.getElementById('quiz-modal');

let articles = [];
let bookmarks = JSON.parse(localStorage.getItem('fn-bookmarks')) || [];
let isShowingBookmarks = false;
let currentQuiz = [];
let quizStep = 0;
let userScore = 0;

async function loadNews(params = 'category=general') {
    isShowingBookmarks = false;
    bookmarkBtn.innerText = "🔖 Bookmarks";
    newsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">⚡ Syncing latest headlines...</p>';
    
    try {
        const response = await fetch(`${BASE_URL}/news?${params}`);
        const data = await response.json();
        if (data.status === "ok") {
            articles = data.articles.filter(a => a.title && a.description && a.title !== '[Removed]');
            displayNews(articles);
        }
    } catch (err) {
        newsGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: red;">❌ Connection Error: Check backend status.</p>`;
    }
}

function displayNews(newsItems) {
    if (newsItems.length === 0) {
        newsGrid.innerHTML = "<p style='grid-column: 1/-1; text-align: center;'>No stories found.</p>";
        return;
    }
    newsGrid.innerHTML = newsItems.map((item, index) => {
        const isSaved = bookmarks.some(b => b.title === item.title);
        return `
            <div class="card">
                <img src="${item.urlToImage || 'https://via.placeholder.com/400x200'}" alt="news">
                <div class="card-body">
                    <h3>${item.title}</h3>
                    <button class="summary-toggle-btn" onclick="toggleSummary(${index})">📋 Brief Summary</button>
                    <div id="summary-${index}" class="card-summary hidden">
                        <strong>Overview:</strong> ${item.description}
                    </div>
                    <a href="${item.url}" target="_blank">Full Story</a>
                </div>
                <button class="bookmark-btn" onclick="toggleBookmark(${index})">
                    ${isSaved ? '🗑 Remove' : '🔖 Bookmark'}
                </button>
            </div>`;
    }).join('');
}

window.toggleSummary = (index) => {
    const el = document.getElementById(`summary-${index}`);
    const isHidden = el.classList.toggle('hidden');
    el.previousElementSibling.innerText = isHidden ? "📋 Brief Summary" : "✖ Hide Details";
};

document.getElementById('search-btn').onclick = () => {
    const query = searchInput.value.trim();
    if (query) {
        document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
        sectionTitle.innerText = `Results for: ${query}`;
        loadNews(`q=${encodeURIComponent(query)}`);
    }
};

document.querySelectorAll('.category-btn').forEach(btn => {
    btn.onclick = (e) => {
        document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        const cat = e.target.dataset.category;
        sectionTitle.innerText = `${cat.charAt(0).toUpperCase() + cat.slice(1)} Feed`;
        loadNews(`category=${cat}`);
    };
});

document.getElementById('start-quiz-btn').onclick = async () => {
    quizModal.style.display = 'block';
    const container = document.getElementById('quiz-container');
    container.innerHTML = "<p>Generating challenge...</p>";
    document.getElementById('quiz-results').innerHTML = "";

    try {
        const response = await fetch(`${BASE_URL}/quiz`);
        currentQuiz = await response.json();
        quizStep = 0;
        userScore = 0;
        renderQuestion();
    } catch (err) {
        container.innerHTML = `<p style="color:red">Error loading quiz.</p>`;
    }
};

function renderQuestion() {
    const container = document.getElementById('quiz-container');
    const q = currentQuiz[quizStep];
    container.innerHTML = `
        <div class="quiz-header">
            <span><strong>Question ${quizStep + 1}</strong> / 5</span>
        </div>
        <p class="quiz-question-text">${q.question}</p>
        <div class="quiz-options-list">
            ${q.options.map((opt, i) => `
                <label class="quiz-option-card">
                    <input type="radio" name="q-opt" value="${opt.replace(/"/g, '&quot;')}">
                    <span class="opt-text">${opt}</span>
                </label>
            `).join('')}
        </div>
    `;
    document.getElementById('submit-quiz').style.display = 'block';
}

document.getElementById('submit-quiz').onclick = () => {
    const selected = document.querySelector('input[name="q-opt"]:checked');
    if (!selected) return alert("Select an option!");

    const results = document.getElementById('quiz-results');
    if (selected.value === currentQuiz[quizStep].answer) {
        userScore++;
        results.innerHTML = "<p style='color:green;'>✅ Correct!</p>";
    } else {
        results.innerHTML = `<p style='color:red;'>❌ Incorrect.</p>`;
    }

    document.getElementById('submit-quiz').style.display = 'none';
    setTimeout(() => {
        quizStep++;
        if (quizStep < 5) renderQuestion();
        else {
            document.getElementById('quiz-container').innerHTML = `<h3>Final Score: ${userScore}/5</h3>`;
            document.getElementById('quiz-results').innerHTML = `<button onclick="location.reload()" class="bookmark-btn">Finish</button>`;
        }
    }, 1500);
};

window.toggleBookmark = (idx) => {
    const list = isShowingBookmarks ? bookmarks : articles;
    const item = list[idx];
    const exists = bookmarks.findIndex(b => b.title === item.title);
    if (exists > -1) bookmarks.splice(exists, 1);
    else bookmarks.push(item);
    localStorage.setItem('fn-bookmarks', JSON.stringify(bookmarks));
    displayNews(isShowingBookmarks ? bookmarks : articles);
};

bookmarkBtn.onclick = () => {
    isShowingBookmarks = !isShowingBookmarks;
    bookmarkBtn.innerText = isShowingBookmarks ? "🏠 Home" : "🔖 Bookmarks";
    sectionTitle.innerText = isShowingBookmarks ? "Saved Stories" : "Latest Headlines";
    displayNews(isShowingBookmarks ? bookmarks : articles);
};

document.getElementById('theme-toggle').onclick = () => {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
};

document.querySelector('.close-btn').onclick = () => {
    quizModal.style.display = 'none';
};

loadNews();
