# Enhanced Flask Server for WellnessGrid with Multi-turn Chat Support
# Supports PubMedBERT embeddings and BioMistral generation with chat history

from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
from transformers import AutoTokenizer, AutoModel, AutoModelForCausalLM, BitsAndBytesConfig
import numpy as np
import logging
import traceback
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Global variables for models
pubmedbert_model = None
pubmedbert_tokenizer = None
biomistral_model = None
biomistral_tokenizer = None

def load_pubmedbert():
    """Load PubMedBERT model for embeddings"""
    global pubmedbert_model, pubmedbert_tokenizer
    try:
        logger.info("Loading PubMedBERT model...")
        model_name = "NeuML/pubmedbert-base-embeddings"
        pubmedbert_tokenizer = AutoTokenizer.from_pretrained(model_name)
        pubmedbert_model = AutoModel.from_pretrained(model_name)
        pubmedbert_model.eval()
        logger.info("✅ PubMedBERT model loaded successfully")
    except Exception as e:
        logger.error(f"❌ Error loading PubMedBERT: {str(e)}")
        raise

def load_biomistral():
    """Load BioMistral model for generation"""
    global biomistral_model, biomistral_tokenizer
    try:
        logger.info("Loading BioMistral model...")
        model_name = "BioMistral/BioMistral-7B"
        
        # Configure quantization for memory efficiency
        quantization_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_use_double_quant=True,
            bnb_4bit_quant_type="nf4"
        )
        
        biomistral_tokenizer = AutoTokenizer.from_pretrained(model_name)
        biomistral_model = AutoModelForCausalLM.from_pretrained(
            model_name,
            quantization_config=quantization_config,
            device_map="auto",
            torch_dtype=torch.float16
        )
        
        # Set pad token
        if biomistral_tokenizer.pad_token is None:
            biomistral_tokenizer.pad_token = biomistral_tokenizer.eos_token
            
        logger.info("✅ BioMistral model loaded successfully")
    except Exception as e:
        logger.error(f"❌ Error loading BioMistral: {str(e)}")
        raise

def format_chat_history_for_prompt(history_list):
    """Format chat history for BioMistral prompt"""
    if not history_list:
        return ""
    
    formatted_history = []
    for msg in history_list:
        role = msg.get('role', 'user')
        content = msg.get('content', '')
        role_label = 'User' if role == 'user' else 'Assistant'
        formatted_history.append(f"{role_label}: {content}")
    
    return '\n'.join(formatted_history) + '\n'

def create_biomistral_prompt(query, context, history_list=None):
    """Create a comprehensive prompt for BioMistral with chat history"""
    
    # Format chat history if provided
    history_str = ""
    if history_list:
        history_str = format_chat_history_for_prompt(history_list)
        if history_str:
            history_str = f"Previous conversation:\n{history_str}\n"
    
    # Create the full prompt
    prompt = f"""You are a medical AI assistant providing evidence-based information. Use the provided medical context to answer the user's question accurately and helpfully.

{history_str}Current query: {query}

Relevant Medical Information:
{context}

Instructions:
- Provide accurate, evidence-based medical information
- Reference the provided context when relevant
- Consider the conversation history for continuity
- Be thorough but concise
- Include appropriate medical disclaimers
- If the query relates to previous discussion, acknowledge that context

Response:"""
    
    return prompt

@app.route('/embed', methods=['POST'])
def embed_text():
    """Generate PubMedBERT embeddings for text"""
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        logger.info(f"🔍 Generating embedding for text: {text[:100]}...")
        
        # Tokenize and get embeddings
        inputs = pubmedbert_tokenizer(text, return_tensors='pt', padding=True, truncation=True, max_length=512)
        
        with torch.no_grad():
            outputs = pubmedbert_model(**inputs)
            # Use mean pooling of last hidden states
            embeddings = outputs.last_hidden_state.mean(dim=1)
            embedding_list = embeddings.squeeze().numpy().tolist()
        
        logger.info(f"✅ Generated embedding with {len(embedding_list)} dimensions")
        
        return jsonify({
            'embedding': embedding_list,
            'dimensions': len(embedding_list),
            'model': 'NeuML/pubmedbert-base-embeddings'
        })
        
    except Exception as e:
        logger.error(f"❌ Error in embed endpoint: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/generate', methods=['POST'])
def generate_response():
    """Generate medical response using BioMistral with chat history support"""
    try:
        data = request.get_json()
        query = data.get('query', '')
        context = data.get('context', '')
        history = data.get('history', [])  # New: chat history
        max_tokens = data.get('max_tokens', 200)
        temperature = data.get('temperature', 0.7)
        
        if not query:
            return jsonify({'error': 'No query provided'}), 400
        
        logger.info(f"🔬 Generating response for query: {query[:100]}...")
        logger.info(f"📚 Context length: {len(context)} characters")
        logger.info(f"💬 Chat history: {len(history)} messages")
        
        # Create prompt with chat history
        prompt = create_biomistral_prompt(query, context, history)
        
        logger.info(f"📝 Generated prompt length: {len(prompt)} characters")
        
        # Tokenize prompt
        inputs = biomistral_tokenizer(
            prompt, 
            return_tensors='pt', 
            padding=True, 
            truncation=True, 
            max_length=2048
        )
        
        # Generate response
        with torch.no_grad():
            outputs = biomistral_model.generate(
                inputs['input_ids'],
                attention_mask=inputs['attention_mask'],
                max_new_tokens=max_tokens,
                temperature=temperature,
                do_sample=True,
                pad_token_id=biomistral_tokenizer.eos_token_id,
                eos_token_id=biomistral_tokenizer.eos_token_id,
                repetition_penalty=1.1
            )
        
        # Decode response
        response = biomistral_tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # Extract only the generated part (after the prompt)
        answer = response[len(prompt):].strip()
        
        # Clean up the answer
        if answer.startswith("Response:"):
            answer = answer[9:].strip()
        
        logger.info(f"✅ Generated response length: {len(answer)} characters")
        
        return jsonify({
            'answer': answer,
            'model': 'BioMistral/BioMistral-7B',
            'prompt_length': len(prompt),
            'response_length': len(answer),
            'history_messages': len(history),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"❌ Error in generate endpoint: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        models_loaded = {
            'pubmedbert': pubmedbert_model is not None,
            'biomistral': biomistral_model is not None
        }
        
        return jsonify({
            'status': 'healthy',
            'models_loaded': models_loaded,
            'features': {
                'embeddings': models_loaded['pubmedbert'],
                'generation': models_loaded['biomistral'],
                'chat_history': True,
                'multi_turn': True
            },
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'status': 'error', 'error': str(e)}), 500

@app.route('/status', methods=['GET'])
def status():
    """Detailed status endpoint"""
    try:
        device_info = {
            'cuda_available': torch.cuda.is_available(),
            'device_count': torch.cuda.device_count() if torch.cuda.is_available() else 0,
            'current_device': torch.cuda.current_device() if torch.cuda.is_available() else None
        }
        
        if torch.cuda.is_available():
            device_info['gpu_name'] = torch.cuda.get_device_name()
            device_info['gpu_memory'] = {
                'allocated': torch.cuda.memory_allocated(),
                'reserved': torch.cuda.memory_reserved()
            }
        
        return jsonify({
            'server': 'WellnessGrid Enhanced Flask Server',
            'version': '2.0.0',
            'features': {
                'pubmedbert_embeddings': True,
                'biomistral_generation': True,
                'chat_history_support': True,
                'multi_turn_conversations': True,
                'quantized_models': True
            },
            'models': {
                'embedding_model': 'NeuML/pubmedbert-base-embeddings',
                'generation_model': 'BioMistral/BioMistral-7B',
                'pubmedbert_loaded': pubmedbert_model is not None,
                'biomistral_loaded': biomistral_model is not None
            },
            'device_info': device_info,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    try:
        logger.info("🚀 Starting WellnessGrid Enhanced Flask Server...")
        
        # Load models
        load_pubmedbert()
        load_biomistral()
        
        logger.info("🎉 All models loaded successfully!")
        logger.info("🌐 Server starting on http://localhost:5001")
        logger.info("📋 Available endpoints:")
        logger.info("  - POST /embed - Generate PubMedBERT embeddings")
        logger.info("  - POST /generate - Generate BioMistral responses with chat history")
        logger.info("  - GET /health - Health check")
        logger.info("  - GET /status - Detailed status")
        
        app.run(host='0.0.0.0', port=5001, debug=False)
        
    except Exception as e:
        logger.error(f"❌ Failed to start server: {str(e)}")
        logger.error(traceback.format_exc())
        raise 