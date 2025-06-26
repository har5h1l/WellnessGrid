#!/usr/bin/env python3
"""
Quick Local Flask Server for WellnessGrid RAG System
Provides PubMedBERT embeddings and BioGPT text generation locally
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys

# Add error handling for missing packages
try:
    from sentence_transformers import SentenceTransformer
    import torch
    from transformers import BioGptTokenizer, BioGptForCausalLM
    import numpy as np
except ImportError as e:
    print(f"❌ Missing package: {e}")
    print("📦 Install with: pip install sentence-transformers transformers torch flask flask-cors numpy")
    sys.exit(1)

app = Flask(__name__)
CORS(app)

# Global model variables
embedding_model = None
biogpt_model = None
biogpt_tokenizer = None

def load_embedding_model():
    """Load PubMedBERT embedding model"""
    global embedding_model
    if embedding_model is None:
        print("🧠 Loading PubMedBERT embedding model...")
        try:
            embedding_model = SentenceTransformer('NeuML/pubmedbert-base-embeddings')
            print("✅ PubMedBERT loaded successfully")
        except Exception as e:
            print(f"❌ Failed to load PubMedBERT: {e}")
            raise e
    return embedding_model

def load_biogpt_model():
    """Load BioGPT model for text generation"""
    global biogpt_model, biogpt_tokenizer
    if biogpt_model is None:
        print("🤖 Loading BioGPT model...")
        try:
            biogpt_tokenizer = BioGptTokenizer.from_pretrained("microsoft/biogpt")
            biogpt_model = BioGptForCausalLM.from_pretrained("microsoft/biogpt")
            print("✅ BioGPT loaded successfully")
        except Exception as e:
            print(f"❌ Failed to load BioGPT: {e}")
            # Non-critical error - we can still do embeddings
            pass
    return biogpt_model, biogpt_tokenizer

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    try:
        # Test embedding model
        model = load_embedding_model()
        embedding_status = "✅ Ready" if model else "❌ Failed"
        
        # Test BioGPT model
        try:
            biogpt, tokenizer = load_biogpt_model()
            biogpt_status = "✅ Ready" if biogpt and tokenizer else "❌ Failed"
        except:
            biogpt_status = "❌ Failed"
        
        return jsonify({
            "status": "healthy",
            "message": "Local Flask server running",
            "models": {
                "pubmedbert_embeddings": embedding_status,
                "biogpt_generation": biogpt_status
            },
            "endpoints": ["/health", "/embed", "/generate", "/ask"]
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Health check failed: {str(e)}"
        }), 500

@app.route('/embed', methods=['POST'])
def generate_embedding():
    """Generate PubMedBERT embeddings for text"""
    try:
        data = request.get_json()
        text = data.get("text", "")
        
        if not text:
            return jsonify({"error": "Missing 'text' field."}), 400
        
        print(f"🧠 Generating embedding for: {text[:50]}...")
        
        # Load and use embedding model
        model = load_embedding_model()
        embedding = model.encode([text])[0].tolist()
        
        print(f"✅ Generated PubMedBERT embedding ({len(embedding)} dimensions)")
        return jsonify({"embedding": embedding})
        
    except Exception as e:
        print(f"❌ Embedding generation failed: {str(e)}")
        return jsonify({"error": f"Embedding generation failed: {str(e)}"}), 500

@app.route('/generate', methods=['POST'])
def generate_text():
    """Generate text using BioGPT"""
    try:
        data = request.get_json()
        query = data.get("query", "")
        context = data.get("context", "")
        max_tokens = data.get("max_tokens", 150)
        temperature = data.get("temperature", 0.7)
        
        if not query:
            return jsonify({"error": "Missing 'query' field."}), 400
        
        print(f"🤖 Generating response for: {query[:50]}...")
        
        # Try to load BioGPT
        model, tokenizer = load_biogpt_model()
        
        if not model or not tokenizer:
            # Enhanced fallback response using structured medical format
            if context and len(context.strip()) > 0:
                # Parse and clean the context to extract medical information
                context_lines = context.split('\n')
                relevant_passages = []
                
                for line in context_lines:
                    line = line.strip()
                    if line and not line.startswith('Source:') and len(line) > 20:
                        relevant_passages.append(line)
                
                if relevant_passages:
                    # Take top 3 most relevant passages
                    top_passages = relevant_passages[:3]
                    formatted_context = '\n'.join([f"- {passage}" for passage in top_passages])
                    
                    # Create structured medical response
                    fallback_answer = f"""Based on the medical information provided in the context:

{formatted_context}

This information suggests that {query.lower()} involves the medical concepts described above. However, for accurate diagnosis, personalized treatment recommendations, or specific medical advice, please consult with a qualified healthcare professional who can evaluate your individual situation.

**Disclaimer**: This response is based solely on the provided medical context and should not replace professional medical consultation."""
                else:
                    fallback_answer = "I could not find sufficient relevant medical information in the provided context to answer your question accurately. Please consult with a healthcare professional for reliable medical advice."
            else:
                fallback_answer = "No medical context was provided to answer this question. Please consult with a healthcare professional for accurate medical information."
            return jsonify({"answer": fallback_answer})
        
        # Prepare input text with advanced medical prompt structure
        input_text = f"""You are a helpful and accurate medical assistant. Use the following context to answer the question.

Context:
{context}

Question: {query}

Answer (based only on the context, no assumptions):"""
        
        # Generate response with optimized settings
        try:
            import time
            
            inputs = tokenizer.encode(input_text, return_tensors="pt", max_length=256, truncation=True)
            
            start_time = time.time()
            with torch.no_grad():
                outputs = model.generate(
                    inputs,
                    max_length=inputs.shape[1] + min(max_tokens, 60),  # Very conservative token limit
                    temperature=temperature,
                    pad_token_id=tokenizer.eos_token_id,
                    do_sample=False,  # Use greedy decoding for speed
                    num_beams=1,  # Use greedy decoding for speed
                    early_stopping=True
                )
            
            generation_time = time.time() - start_time
            print(f"✅ BioGPT generation completed in {generation_time:.2f}s")
            
            # Decode response
            response = tokenizer.decode(outputs[0], skip_special_tokens=True)
            answer = response[len(input_text):].strip()
            
        except Exception as e:
            print(f"⚠️ BioGPT generation failed: {e}")
            # Use enhanced fallback instead
            answer = None
        
        # Check if the generated answer is too short, low quality, or None (timeout/error)
        if not answer or len(answer) < 20 or answer.lower().startswith(('what is', 'how to', 'the', 'it is')):
            print(f"⚠️ BioGPT response too short ({len(answer)} chars), using enhanced fallback")
            # Use the enhanced fallback logic with structured format
            if context and len(context.strip()) > 0:
                context_lines = context.split('\n')
                relevant_passages = []
                
                for line in context_lines:
                    line = line.strip()
                    if line and not line.startswith('Source:') and len(line) > 20:
                        relevant_passages.append(line)
                
                if relevant_passages:
                    # Take top 3 most relevant passages
                    top_passages = relevant_passages[:3]
                    formatted_context = '\n'.join([f"- {passage}" for passage in top_passages])
                    
                    # Create structured medical response
                    enhanced_answer = f"""Based on the medical information provided in the context:

{formatted_context}

This information suggests that {query.lower()} involves the medical concepts described above. However, for accurate diagnosis, personalized treatment recommendations, or specific medical advice, please consult with a qualified healthcare professional who can evaluate your individual situation.

**Disclaimer**: This response is based solely on the provided medical context and should not replace professional medical consultation."""
                    return jsonify({"answer": enhanced_answer})
        
        print(f"✅ Generated response ({len(answer)} chars)")
        return jsonify({"answer": answer})
        
    except Exception as e:
        print(f"❌ Text generation failed: {str(e)}")
        # Return fallback response
        fallback_answer = "I encountered an issue generating a response. Please consult with a healthcare professional for medical advice."
        return jsonify({"answer": fallback_answer})

@app.route('/ask', methods=['POST'])
def ask_rag():
    """Main RAG endpoint - combines embedding + generation"""
    try:
        data = request.get_json()
        question = data.get("question", "")
        
        if not question:
            return jsonify({"error": "Missing 'question' field."}), 400
        
        print(f"🔍 Processing RAG query: {question[:50]}...")
        
        # For now, just return a simple response
        # Your Next.js app will handle the full RAG pipeline
        return jsonify({
            "query": question,
            "answer": "This endpoint is available. Your Next.js app handles the full RAG pipeline.",
            "sources": [],
            "metadata": {
                "documentsUsed": 0,
                "totalFound": 0,
                "contextLength": 0,
                "flaskBackendUsed": True,
                "processingTime": "2025-06-23T19:00:00.000Z"
            }
        })
        
    except Exception as e:
        print(f"❌ RAG query failed: {str(e)}")
        return jsonify({"error": f"RAG query failed: {str(e)}"}), 500

if __name__ == '__main__':
    print("🚀 Starting Local Flask Server for WellnessGrid...")
    print("📡 Endpoints:")
    print("  - GET  /health  - Health check")
    print("  - POST /embed   - Generate PubMedBERT embeddings")
    print("  - POST /generate - Generate text with BioGPT")
    print("  - POST /ask     - Main RAG endpoint")
    print("")
    print("🧠 Loading models (this may take a few minutes)...")
    
    # Pre-load embedding model
    try:
        load_embedding_model()
    except Exception as e:
        print(f"⚠️ Could not load embedding model: {e}")
    
    print("🌐 Starting Flask server on http://localhost:5001...")
    app.run(host='0.0.0.0', port=5001, debug=True) 