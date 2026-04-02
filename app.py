from flask import Flask, jsonify, request
import requests
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # This allows your frontend to communicate with this server

# Moved from script.js to keep it secure on the server
API_KEY = '7c2613a97f8d46f3a8e2bfd0546893b5' 

@app.route('/api/news', methods=['GET'])
def get_news():
    category = request.args.get('category', 'general')
    query = request.args.get('q', '')
    
    # Logic based on the original frontend requirements
    if query:
        url = f"https://newsapi.org/v2/everything?q={query}&apiKey={API_KEY}"
    else:
        url = f"https://newsapi.org/v2/top-headlines?country=us&category={category}&apiKey={API_KEY}"

    try:
        response = requests.get(url)
        return jsonify(response.json())
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)