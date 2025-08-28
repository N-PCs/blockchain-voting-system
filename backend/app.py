from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit
from blockchain import Blockchain

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")  # Allow CORS for frontend

blockchain = Blockchain()

@app.route('/mine', methods=['GET'])
def mine():
    block = blockchain.mine_block()
    socketio.emit('new_block', {'message': 'New block mined!', 'block': block})  # Broadcast via WebSocket
    socketio.emit('update_results', blockchain.get_results())  # Update results in real-time
    return jsonify({'message': 'New block mined!', 'block': block}), 200

@app.route('/vote', methods=['POST'])
def vote():
    values = request.get_json()
    required = ['voter_id', 'candidate']
    if not all(k in values for k in required):
        return 'Missing values', 400
    
    try:
        index = blockchain.add_vote(values['voter_id'], values['candidate'])
        socketio.emit('new_vote', {'message': 'Vote added to pending!', 'index': index})  # Broadcast new vote
        return jsonify({'message': f'Vote will be added to Block {index}'}), 201
    except ValueError as e:
        return str(e), 400

@app.route('/chain', methods=['GET'])
def get_chain():
    response = {
        'chain': blockchain.chain,
        'length': len(blockchain.chain),
        'valid': blockchain.is_chain_valid()
    }
    return jsonify(response), 200

@app.route('/results', methods=['GET'])
def get_results():
    return jsonify(blockchain.get_results()), 200

@socketio.on('connect')
def handle_connect():
    emit('message', {'data': 'Connected to WebSocket'})

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)