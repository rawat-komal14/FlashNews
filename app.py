from flask import Flask, jsonify, request
import requests
from flask_cors import CORS
import random

app = Flask(__name__)
CORS(app)

SECURE_KEY = '7c2613a97f8d46f3a8e2bfd0546893b5' 

@app.route('/api/news')
def get_news():
    query = request.args.get('q')
    category = request.args.get('category', 'general')
    
    if query:
        url = f"https://newsapi.org/v2/everything?q={query}&language=en&pageSize=20&apiKey={SECURE_KEY}"
    else:
        url = f"https://newsapi.org/v2/top-headlines?country=us&category={category}&pageSize=20&apiKey={SECURE_KEY}"

    try:
        response = requests.get(url)
        return jsonify(response.json())
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/quiz')
def get_quiz():
    url = f"https://newsapi.org/v2/top-headlines?country=us&pageSize=30&apiKey={SECURE_KEY}"

    try:
        res = requests.get(url).json()
        articles = [a for a in res.get('articles', []) if a.get('description') and a.get('title')]
        
        if len(articles) < 5:
            return jsonify({"status": "error", "message": "Not enough news"}), 404

        quiz_data = []
        templates = [
            "A recent report focuses on: '{subject}'. What is the main outcome described?",
            "Regarding the news about '{subject}', which of the following is happening?",
            "What is the key update in the latest report about '{subject}'?"
        ]

        for art in articles[:5]:
            subject = " ".join(art['title'].split()[:5]).split(' - ')[0]
            others = [a['description'] for a in articles if a['title'] != art['title']]
            wrong = random.sample(others, 2)
            
            quiz_data.append({
                "question": random.choice(templates).format(subject=subject),
                "options": [art['description'], wrong[0], wrong[1]],
                "answer": art['description']
            })
            random.shuffle(quiz_data[-1]['options'])
            
        return jsonify(quiz_data)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5001, debug=True)
