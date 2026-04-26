from flask import Flask, jsonify, request
import requests
from flask_cors import CORS
import random

app = Flask(__name__)
CORS(app)

API_KEY = '7c2613a97f8d46f3a8e2bfd0546893b5'

@app.route('/api/news', methods=['GET'])
def get_news():
    category = request.args.get('category', 'general')
    url = f"https://newsapi.org/v2/top-headlines?country=us&category={category}&apiKey={API_KEY}"
    response = requests.get(url)
    return jsonify(response.json())

# --- NEW QUIZ GENERATION ROUTE ---
@app.route('/api/quiz', methods=['GET'])
def get_quiz():
    url = f"https://newsapi.org/v2/top-headlines?country=us&apiKey={API_KEY}"
    response = requests.get(url).json()
    articles = response.get('articles', [])
    
    quiz_data = []
    # Filter articles that have both a title and a description
    valid_articles = [a for a in articles if a.get('title') and a.get('description')][:5]

    for art in valid_articles:
        title = art['title']
        description = art['description']
        
        # Create a "Subject" by taking the first few words of the headline
        subject = " ".join(title.split()[:4])
        
        # Formulate a proper comprehension question
        question = f"Based on recent reports regarding '{subject}...', what is the main event taking place?"
        
        # Wrong answers are pulled from other random descriptions
        wrong_pool = [a['description'][:100] + "..." for a in articles if a['description'] != description]
        distractors = random.sample(wrong_pool, 2) if len(wrong_pool) >= 2 else ["N/A", "N/A"]
        
        options = [description[:100] + "...", distractors[0], distractors[1]]
        random.shuffle(options)

        quiz_data.append({
            "question": question,
            "options": options,
            "answer": description[:100] + "..."
        })

    return jsonify(quiz_data)

if __name__ == '__main__':
    app.run(port=5000, debug=True)
