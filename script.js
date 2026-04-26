// --- 1. CONFIGURATION & STATE ---
const BACKEND_URL = 'http://localhost:5000/api/news';
const QUIZ_API_URL = 'http://localhost:5000/api/quiz';

const newsGrid = document.getElementById('news-grid');
const searchInput = document.getElementById('search-input');
const sectionTitle = document.getElementById('section-title');
const bookmarkBtn = document.getElementById('show-bookmarks');
const quizModal = document.getElementById('quiz-modal');

let articles = [];
let bookmarks = JSON.parse(localStorage.getItem('fn-bookmarks')) || [];
let isShowingBookmarks = false;

// Quiz State
let currentQuiz = [];
let quizStep = 0;
let userScore = 0;

/**
 * 2. DATA FETCHING (News)
 */
async function loadNews(query = 'general', isSearch = false) {
    isShowingBookmarks = false;
    bookmarkBtn.innerText = "🔖 Bookmarks";
    newsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">⚡ Loading news...</p>';
    
    const url = isSearch ? `${BACKEND_URL}?q=${query}` : `${BACKEND_URL}?category=${query}`;
    sectionTitle.innerText = isSearch ? `Search: ${query}` : `${query.toUpperCase()} Headlines`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === "ok" && data.articles) {
            articles = data.articles.filter(a => a.title && a.title !== '[Removed]' && a.description);
            displayNews(articles);
        }
    } catch (err) {
        newsGrid.innerHTML = "<p style='grid-column: 1/-1; text-align: center;'>❌ Error: Backend not responding.</p>";
    }
}

/**
 * 3. UI RENDERING (News Cards)
 */
function displayNews(newsItems) {
    if (newsItems.length === 0) {
        newsGrid.innerHTML = "<p style='grid-column: 1/-1; text-align: center;'>No articles found.</p>";
        return;
    }
    newsGrid.innerHTML = newsItems.map((item, index) => {
        const isSaved = bookmarks.some(b => b.title === item.title);
        return `
            <div class="card">
                <img src="${item.urlToImage || 'https://via.placeholder.com/400x200'}" alt="news">
                <div class="card-body">
                    <h3>${item.title}</h3>
                    <button class="summary-toggle-btn" onclick="toggleSummary(${index})">📋 View Summary</button>
                    <div id="summary-${index}" class="card-summary hidden">
                        <strong>Brief Summary:</strong> ${item.description}
                    </div>
                    <a href="${item.url}" target="_blank">Read Full Article</a>
                </div>
                <button class="bookmark-btn" onclick="toggleBookmark(${index})">
                    ${isSaved ? '🗑️ Remove' : '🔖 Bookmark'}
                </button>
            </div>`;
    }).join('');
}

// Instant Summary Toggle
window.toggleSummary = (index) => {
    const el = document.getElementById(`summary-${index}`);
    const btn = el.previousElementSibling;
    const isHidden = el.classList.toggle('hidden');
    btn.innerText = isHidden ? "📋 View Summary" : "✖ Hide Summary";
};

/**
 * 4. BOOKMARK SYSTEM
 */
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
    sectionTitle.innerText = isShowingBookmarks ? "My Bookmarks" : "Latest Headlines";
    displayNews(isShowingBookmarks ? bookmarks : articles);
};

/**
 * 5. SEARCH & NAVIGATION
 */
document.getElementById('search-btn').onclick = () => {
    const query = searchInput.value.trim();
    if (query) loadNews(query, true);
};

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') document.getElementById('search-btn').click();
});

document.querySelectorAll('.category-btn').forEach(btn => {
    btn.onclick = (e) => {
        document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        loadNews(e.target.dataset.category);
    };
});

/**
 * 6. ENHANCED QUIZ SYSTEM (Server-Side Proper Questions)
 */
document.getElementById('start-quiz-btn').onclick = async () => {
    quizModal.style.display = 'block';
    const container = document.getElementById('quiz-container');
    container.innerHTML = "<p>Analyzing the news to generate your challenge...</p>";
    document.getElementById('quiz-results').innerHTML = "";

    try {
        const response = await fetch(QUIZ_API_URL);
        currentQuiz = await response.json();
        quizStep = 0;
        userScore = 0;
        renderQuestion();
    } catch (err) {
        container.innerHTML = "<p>Error loading quiz. Please ensure the Python backend is running.</p>";
    }
};

function renderQuestion() {
    const container = document.getElementById('quiz-container');
    const q = currentQuiz[quizStep];

    container.innerHTML = `
        <p><strong>Question ${quizStep + 1} of 5</strong></p>
        <p style="font-size: 1.1rem; margin: 15px 0; font-weight: 500;">${q.question}</p>
        <div style="text-align: left;">
            ${q.options.map(opt => `
                <label class="quiz-option-label" style="display:block; padding:10px; border:1px solid #ddd; margin-bottom:8px; cursor:pointer;">
                    <input type="radio" name="q-opt" value="${opt}"> ${opt}
                </label>
            `).join('')}
        </div>
    `;
    document.getElementById('submit-quiz').style.display = 'block';
}

document.getElementById('submit-quiz').onclick = () => {
    const selected = document.querySelector('input[name="q-opt"]:checked');
    const results = document.getElementById('quiz-results');

    if (!selected) return alert("Please select an answer!");

    if (selected.value === currentQuiz[quizStep].answer) {
        userScore++;
        results.innerHTML = "<p style='color:green; font-weight:bold;'>✅ Correct!</p>";
    } else {
        results.innerHTML = "<p style='color:red; font-weight:bold;'>❌ Incorrect. Check the news headlines to learn more!</p>";
    }

    document.getElementById('submit-quiz').style.display = 'none';

    setTimeout(() => {
        quizStep++;
        if (quizStep < 5) {
            renderQuestion();
        } else {
            showFinalResults();
        }
    }, 1500);
};

function showFinalResults() {
    const container = document.getElementById('quiz-container');
    container.innerHTML = `
        <h3>Challenge Complete!</h3>
        <p style="font-size: 2rem; margin: 20px 0;">Final Score: ${userScore} / 5</p>
        <button onclick="location.reload()" style="padding:10px 20px; cursor:pointer; background:var(--accent-color); color:white; border:none; border-radius:5px;">Finish & Exit</button>
    `;
    document.getElementById('quiz-results').innerHTML = "";
}

// Theme Toggle
document.getElementById('theme-toggle').onclick = () => {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
};

// Modal Close
document.querySelector('.close-btn').onclick = () => {
    quizModal.style.display = 'none';
};

// Start App
loadNews();
