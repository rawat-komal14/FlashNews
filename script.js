const BASE_URL = 'http://127.0.0.1:5001/api';

// Getting references of important HTML elements
const newsGrid = document.getElementById('news-grid');
const searchInput = document.getElementById('search-input');
const sectionTitle = document.getElementById('section-title');
const bookmarkBtn = document.getElementById('show-bookmarks');
const quizModal = document.getElementById('quiz-modal');

// Main data storage
let articles = [];
let bookmarks = JSON.parse(localStorage.getItem('fn-bookmarks')) || [];
let isShowingBookmarks = false;

// Quiz related variables
let currentQuiz = [];
let quizStep = 0, userScore = 0;


// ------------------ LOAD NEWS ------------------
async function loadNews(params = 'category=general') {
    isShowingBookmarks = false;

    // Show loading message
    newsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">⚡ Loading...</p>';

    try {
        const res = await fetch(`${BASE_URL}/news?${params}`);
        const data = await res.json();

        if (data.status === "ok") {
            // Filter valid articles
            articles = data.articles.filter(a => a.title && a.description && a.title !== '[Removed]');
            displayNews(articles);
        } else {
            throw new Error(data.message);
        }

    } catch (err) {
        newsGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: red;">Backend Error: ${err.message}</p>`;
    }
}


// ------------------ DISPLAY NEWS ------------------
function displayNews(items) {
    newsGrid.innerHTML = items.map((item, idx) => {
        const isSaved = bookmarks.some(b => b.title === item.title);

        return `<div class="card">
            <img src="${item.urlToImage || 'https://via.placeholder.com/400x200'}">
            <div class="card-body">
                <h3>${item.title}</h3>

                <!-- Toggle summary button -->
                <button class="summary-toggle-btn" onclick="toggleSummary(${idx})">📋 View Summary</button>

                <!-- Hidden summary -->
                <div id="summary-${idx}" class="card-summary hidden">${item.description}</div>

                <a href="${item.url}" target="_blank">Full Story</a>
            </div>

            <!-- Bookmark button -->
            <button class="bookmark-btn" onclick="toggleBookmark(${idx})">
                ${isSaved ? '🗑️ Remove' : '🔖 Bookmark'}
            </button>
        </div>`;
    }).join('');
}


// ------------------ SUMMARY TOGGLE ------------------
window.toggleSummary = (idx) => {
    const el = document.getElementById(`summary-${idx}`);

    const isHidden = el.classList.toggle('hidden');

    // Change button text based on state
    el.previousElementSibling.innerText = isHidden 
        ? "📋 View Summary" 
        : "✖ Hide Summary";
};


// ------------------ SEARCH ------------------
document.getElementById('search-btn').onclick = () => {
    const query = searchInput.value.trim();

    if (query) {
        sectionTitle.innerText = `Searching: ${query}`;
        loadNews(`q=${encodeURIComponent(query)}`);
    }
};


// ------------------ CATEGORY BUTTONS ------------------
document.querySelectorAll('.category-btn').forEach(btn => {
    btn.onclick = (e) => {
        const cat = e.target.dataset.category;

        sectionTitle.innerText = `${cat.toUpperCase()} Headlines`;
        loadNews(`category=${cat}`);
    };
});


// ------------------ QUIZ START ------------------
document.getElementById('start-quiz-btn').onclick = async () => {
    quizModal.style.display = 'block';

    const container = document.getElementById('quiz-container');
    container.innerHTML = "Generating challenge...";

    try {
        const res = await fetch(`${BASE_URL}/quiz`);
        currentQuiz = await res.json();

        quizStep = 0;
        userScore = 0;

        renderQuestion();

    } catch (err) {
        container.innerHTML = "Error loading quiz.";
    }
};


// ------------------ RENDER QUESTION ------------------
function renderQuestion() {
    const q = currentQuiz[quizStep];

    document.getElementById('quiz-container').innerHTML = `
        <p><strong>Question ${quizStep+1} of 5</strong></p>
        <p><strong>${q.question}</strong></p>

        ${q.options.map((opt, i) => `
            <label class="quiz-option-card">
                <input type="radio" name="q-opt" value="${opt.replace(/"/g, '&quot;')}">
                <span class="opt-letter">${String.fromCharCode(65+i)}</span> ${opt}
            </label>
        `).join('')}
    `;

    document.getElementById('submit-quiz').style.display = 'block';
}


// ------------------ SUBMIT ANSWER ------------------
document.getElementById('submit-quiz').onclick = () => {
    const sel = document.querySelector('input[name="q-opt"]:checked');

    if (!sel) return alert("Select an answer!");

    if (sel.value === currentQuiz[quizStep].answer) {
        userScore++;
    }

    document.getElementById('submit-quiz').style.display = 'none';

    setTimeout(() => {
        quizStep++;

        if (quizStep < 5) {
            renderQuestion();
        } else {
            document.getElementById('quiz-container').innerHTML =
                `<h3>Final Score: ${userScore} / 5</h3>`;
        }
    }, 1000);
};


// ------------------ BOOKMARK ------------------
window.toggleBookmark = (idx) => {
    const item = isShowingBookmarks ? bookmarks[idx] : articles[idx];

    const existIdx = bookmarks.findIndex(b => b.title === item.title);

    if (existIdx > -1) {
        bookmarks.splice(existIdx, 1);
    } else {
        bookmarks.push(item);
    }

    localStorage.setItem('fn-bookmarks', JSON.stringify(bookmarks));

    displayNews(isShowingBookmarks ? bookmarks : articles);
};


// ------------------ SHOW BOOKMARKS ------------------
bookmarkBtn.onclick = () => {
    isShowingBookmarks = !isShowingBookmarks;

    bookmarkBtn.innerText = isShowingBookmarks ? "🏠 Home" : "🔖 Bookmarks";

    displayNews(isShowingBookmarks ? bookmarks : articles);
};


// ------------------ THEME TOGGLE ------------------
document.getElementById('theme-toggle').onclick = () => {
    const theme = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';

    document.body.setAttribute('data-theme', theme);
};


// Close quiz modal
document.querySelector('.close-btn').onclick = () => {
    quizModal.style.display = 'none';
};


// Initial load
loadNews();
