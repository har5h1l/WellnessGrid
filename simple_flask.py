#!/usr/bin/env python3
"""
Simple Flask Server - Just provides /embed endpoint with 768D embeddings
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "message": "Simple Flask server running",
        "endpoints": ["/health", "/embed"]
    })

@app.route('/embed', methods=['POST'])
def generate_embedding():
    """Generate 768-dimensional embeddings (matches PubMedBERT dimensions)"""
    try:
        data = request.get_json()
        text = data.get("text", "")
        
        if not text:
            return jsonify({"error": "Missing 'text' field."}), 400
        
        print(f"🧠 Generating embedding for: {text[:50]}...")
        
        # Generate 768-dimensional embedding (same as PubMedBERT)
        # Using deterministic random based on text hash for consistency
        np.random.seed(hash(text) % 2**32)
        embedding = np.random.rand(768).tolist()
        
        print(f"✅ Generated embedding ({len(embedding)} dimensions)")
        return jsonify({"embedding": embedding})
        
    except Exception as e:
        print(f"❌ Embedding generation failed: {str(e)}")
        return jsonify({"error": f"Embedding generation failed: {str(e)}"}), 500

@app.route('/generate', methods=['POST'])
def generate_text():
    """Simple text generation fallback"""
    try:
        data = request.get_json()
        query = data.get("query", "")
        context = data.get("context", "")
        
        if not query:
            return jsonify({"error": "Missing 'query' field."}), 400
        
        print(f"🤖 Generating response for: {query[:50]}...")
        
        # Simple fallback response
        answer = f"Based on the available medical information about '{query}', please consult with a healthcare professional for specific medical advice."
        
        return jsonify({"answer": answer})
        
    except Exception as e:
        print(f"❌ Text generation failed: {str(e)}")
        return jsonify({"error": f"Text generation failed: {str(e)}"}), 500

if __name__ == '__main__':
    print("🚀 Starting Simple Flask Server...")
    print("📡 Endpoints: /health, /embed, /generate")
    app.run(host='0.0.0.0', port=5001, debug=True) 