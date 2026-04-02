// --- CONFIGURATION ---
const BACKEND_URL = 'http://localhost:5000/api/news'; 
const newsGrid = document.getElementById('news-grid'); //
const searchInput = document.getElementById('search-input'); //
const sectionTitle = document.getElementById('section-title'); //
const bookmarkBtn = document.getElementById('show-bookmarks'); //
const quizModal = document.getElementById('quiz-modal'); //

// --- STATE MANAGEMENT ---
let articles = []; 
let bookmarks = JSON.parse(localStorage.getItem('fn-bookmarks')) || []; //
let isShowingBookmarks = false; //

/**
 * 1. NEWS LOADING LOGIC
 */
async function loadNews(query = 'general', isSearch = false) {
    isShowingBookmarks = false;
    bookmarkBtn.innerText = "🔖 Bookmarks";
    newsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">⚡ Charging news...</p>'; //
    
    let url = isSearch ? `${BACKEND_URL}?q=${query}` : `${BACKEND_URL}?category=${query}`;

    if (isSearch) {
        sectionTitle.innerText = `Search results for: ${query}`; //
    } else {
        sectionTitle.innerText = `${query.charAt(0).toUpperCase() + query.slice(1)} Headlines`; //
    }

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === "ok" && data.articles) {
            articles = data.articles.filter(a => a.title && a.title !== '[Removed]'); //
            displayNews(articles);
        } else {
            throw new Error(data.message || "No news found");
        }
    } catch (err) {
        console.error("Backend Error:", err);
        newsGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center;">
                <p>❌ Could not connect to the Python server.</p>
                <p><small>Make sure app.py is running in your terminal.</small></p>
                <button onclick="loadNews()" style="padding: 10px; cursor: pointer;">Retry Connection</button>
            </div>`;
    }
}

/**
 * 2. UI RENDERING
 */
function displayNews(newsItems) {
    if (newsItems.length === 0) {
        newsGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center;">Nothing here yet!</p>`;
        return;
    }

    newsGrid.innerHTML = newsItems.map((item, index) => {
        const isSaved = bookmarks.some(b => b.title === item.title);
        return `
            <div class="card">
                <img src="${item.urlToImage || 'https://via.placeholder.com/400x200'}" alt="news">
                <div class="card-body">
                    <h3>${item.title}</h3>
                    <p>${item.description ? item.description.substring(0, 80) + '...' : 'No description available.'}</p>
                    <a href="${item.url}" target="_blank">Read Full Article</a>
                </div>
                <button class="bookmark-btn" onclick="toggleBookmark(${index})">
                    ${isSaved ? '🗑️ Remove' : '🔖 Bookmark'}
                </button>
            </div>
        `;
    }).join('');
}

/**
 * 3. BOOKMARK & THEME LISTENERS
 */
window.toggleBookmark = (idx) => {
    const sourceList = isShowingBookmarks ? bookmarks : articles;
    const selectedItem = sourceList[idx];
    const existingIndex = bookmarks.findIndex(b => b.title === selectedItem.title);

    if (existingIndex > -1) bookmarks.splice(existingIndex, 1);
    else bookmarks.push(selectedItem);

    localStorage.setItem('fn-bookmarks', JSON.stringify(bookmarks));
    displayNews(isShowingBookmarks ? bookmarks : articles);
};

bookmarkBtn.onclick = () => {
    isShowingBookmarks = !isShowingBookmarks;
    if (isShowingBookmarks) {
        sectionTitle.innerText = "My Bookmarks";
        bookmarkBtn.innerText = "🏠 Show Latest";
        displayNews(bookmarks);
    } else {
        bookmarkBtn.innerText = "🔖 Bookmarks";
        loadNews(); 
    }
};

// --- FIX: Theme Toggle Logic ---
document.getElementById('theme-toggle').onclick = () => {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    document.body.setAttribute('data-theme', isDark ? 'light' : 'dark'); //
};

/**
 * 4. SEARCH & CATEGORIES
 */
document.getElementById('search-btn').onclick = () => {
    const query = searchInput.value.trim();
    if (query) loadNews(query, true);
};

document.querySelectorAll('.category-btn').forEach(btn => {
    btn.onclick = (e) => {
        document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        loadNews(e.target.dataset.category);
    };
});

/**
 * 5. QUIZ LOGIC
 */
document.getElementById('start-quiz-btn').onclick = () => {
    if (articles.length === 0) return alert("Wait for news to load!");
    quizModal.style.display = 'block';
    const container = document.getElementById('quiz-container');
    const realTitle = articles[0].title;
    
    container.innerHTML = `
        <p><strong>Question:</strong> Which of these events was recently reported?</p>
        <div style="text-align: left; margin-top: 10px;">
            <label><input type="radio" name="q" value="correct"> ${realTitle}</label><br><br>
            <label><input type="radio" name="q" value="wrong"> A secret city was found on the moon.</label>
        </div>`;
    document.getElementById('submit-quiz').style.display = 'block';
};

document.getElementById('submit-quiz').onclick = () => {
    const choice = document.querySelector('input[name="q"]:checked');
    if (!choice) return;
    document.getElementById('quiz-results').innerHTML = 
        choice.value === 'correct' ? "<p style='color:green'>✅ Correct!</p>" : "<p style='color:red'>❌ Incorrect.</p>";
};

document.querySelector('.close-btn').onclick = () => quizModal.style.display = 'none';

// --- INITIALIZE ---
loadNews();