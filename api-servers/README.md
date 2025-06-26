# WellnessGrid API Servers

This directory contains Flask server implementations for the WellnessGrid RAG system.

## Files

### 🚀 Production Servers
- `enhanced_flask_server.py` - Enhanced Flask server with full RAG capabilities
- `local_flask_server.py` - Local development Flask server

### 🧪 Development/Testing
- `simple_flask.py` - Simple Flask server for basic testing

### 📋 Logs
- `flask.log` - Flask server logs

## Usage

### Enhanced Flask Server (Recommended)
```bash
python enhanced_flask_server.py
```
Features:
- Full RAG functionality
- Medical model integration
- Enhanced error handling
- Complete API endpoints

### Local Flask Server (Development)
```bash
python local_flask_server.py
```
Features:
- Local development setup
- Basic RAG functionality
- Simplified configuration

### Simple Flask Server (Testing)
```bash
python simple_flask.py
```
Features:
- Basic endpoints
- Testing and debugging
- Minimal dependencies

## API Endpoints

All servers provide the following endpoints:
- `POST /embed` - Generate embeddings
- `POST /generate` - Generate text responses
- `POST /ask` - RAG query endpoint
- `GET /health` - Health check
- `POST /query` - Document query

Refer to individual server files for complete endpoint documentation. 