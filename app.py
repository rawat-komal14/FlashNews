from flask import Flask, jsonify, request
import requests
from flask_cors import CORS
import random

app = Flask(__name__)
CORS(app)  # Enable CORS so frontend can connect easily

# NOTE: Using News API key (replace if needed later)
API_KEY = '7c2613a97f8d46f3a8e2bfd0546893b5' 

# ------------------ NEWS FETCH API ------------------
@app.route('/api/news')
def get_news():
    # Getting query parameters from frontend
    query = request.args.get('q')
    category = request.args.get('category', 'general')
    
    # If user searches something → use search API
    if query:
        url = f"https://newsapi.org/v2/everything?q={query}&language=en&pageSize=20&apiKey={API_KEY}"
    else:
        # Otherwise load category-based headlines
        url = f"https://newsapi.org/v2/top-headlines?country=us&category={category}&pageSize=20&apiKey={API_KEY}"

    try:
        response = requests.get(url)
        return jsonify(response.json())  # Send response to frontend
    except Exception as e:
        # If any error happens, return message
        return jsonify({"status": "error", "message": str(e)}), 500


# ------------------ QUIZ GENERATOR ------------------
@app.route('/api/quiz')
def get_quiz():
    url = f"https://newsapi.org/v2/top-headlines?country=us&pageSize=30&apiKey={API_KEY}"

    try:
        res = requests.get(url).json()

        # Filter only useful articles (having title + description)
        articles = [a for a in res.get('articles', []) if a.get('description') and a.get('title')]
        
        if len(articles) < 5:
            return jsonify({"status": "error", "message": "Not enough news"}), 404

        quiz_data = []

        # Some different question styles (to avoid repetition)
        templates = [
            "A recent report focuses on: '{subject}'. What is the main outcome described?",
            "Regarding the news about '{subject}', which of the following is happening?",
            "What is the key update in the latest report about '{subject}'?"
        ]

        # Creating 5 quiz questions
        for art in articles[:5]:
            # Taking first few words from title as subject
            subject = " ".join(art['title'].split()[:5]).split(' - ')[0]

            # Pick wrong answers from other articles
            others = [a['description'] for a in articles if a['title'] != art['title']]
            wrong = random.sample(others, 2)
            
            quiz_data.append({
                "question": random.choice(templates).format(subject=subject),
                "options": [art['description'], wrong[0], wrong[1]],
                "answer": art['description']
            })

            # Shuffle options so correct answer is not always first
            random.shuffle(quiz_data[-1]['options'])
            
        return jsonify(quiz_data)

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# Run server
if __name__ == '__main__':
    app.run(port=5001, debug=True)

    
