from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import logging
from blockchain import Blockchain
import threading
import time

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

CORS(app)

# Use threading mode for maximum compatibility
socketio = SocketIO(app, 
                   cors_allowed_origins="*", 
                   async_mode='threading',  # Use threading mode
                   logger=False, 
                   engineio_logger=False)

blockchain = Blockchain()

@app.route('/')
def index():
    return jsonify({
        'message': 'Blockchain Voting System API',
        'endpoints': {
            'mine': '/mine (GET)',
            'vote': '/vote (POST)',
            'chain': '/chain (GET)',
            'results': '/results (GET)',
            'pending': '/pending (GET)'
        }
    })

@app.route('/mine', methods=['GET'])
def mine():
    try:
        block = blockchain.mine_block()
        # Use threading to avoid blocking during emit
        def emit_messages():
            socketio.emit('new_block', {'message': 'New block mined!', 'block': block})
            socketio.emit('update_results', blockchain.get_results())
        
        threading.Thread(target=emit_messages).start()
        
        logger.info(f"Block mined: {block['index']}")
        return jsonify({'message': 'New block mined!', 'block': block}), 200
    except Exception as e:
        logger.error(f"Error mining block: {str(e)}")
        return jsonify({'error': 'Failed to mine block'}), 500

@app.route('/vote', methods=['POST'])
def vote():
    try:
        values = request.get_json()
        if not values:
            return jsonify({'error': 'No data provided'}), 400
            
        required = ['voter_id', 'candidate']
        if not all(k in values for k in required):
            return jsonify({'error': 'Missing values. Required: voter_id, candidate'}), 400
        
        index = blockchain.add_vote(values['voter_id'], values['candidate'])
        
        # Use threading for socket emit
        def emit_vote():
            socketio.emit('new_vote', {'message': 'Vote added to pending!', 'index': index})
        
        threading.Thread(target=emit_vote).start()
        
        logger.info(f"Vote added for candidate: {values['candidate']}")
        return jsonify({'message': f'Vote will be added to Block {index}'}), 201
    except ValueError as e:
        logger.warning(f"Invalid vote attempt: {str(e)}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Error processing vote: {str(e)}")
        return jsonify({'error': 'Failed to process vote'}), 500

@app.route('/chain', methods=['GET'])
def get_chain():
    try:
        response = {
            'chain': blockchain.chain,
            'length': len(blockchain.chain),
            'valid': blockchain.is_chain_valid(),
            'pending_votes': len(blockchain.pending_votes)
        }
        return jsonify(response), 200
    except Exception as e:
        logger.error(f"Error retrieving chain: {str(e)}")
        return jsonify({'error': 'Failed to retrieve chain'}), 500

@app.route('/results', methods=['GET'])
def get_results():
    try:
        return jsonify(blockchain.get_results()), 200
    except Exception as e:
        logger.error(f"Error retrieving results: {str(e)}")
        return jsonify({'error': 'Failed to retrieve results'}), 500

@app.route('/pending', methods=['GET'])
def get_pending():
    try:
        return jsonify(blockchain.pending_votes), 200
    except Exception as e:
        logger.error(f"Error retrieving pending votes: {str(e)}")
        return jsonify({'error': 'Failed to retrieve pending votes'}), 500

@socketio.on('connect')
def handle_connect():
    logger.info('Client connected')
    emit('message', {'data': 'Connected to WebSocket'})

@socketio.on('disconnect')
def handle_disconnect():
    logger.info('Client disconnected')

if __name__ == '__main__':
    logger.info("Starting Blockchain Voting System Server...")
    socketio.run(app, debug=True, host='0.0.0.0', port=5000, use_reloader=False)
