"""
Flask API for blockchain voting system.
PHP backend communicates with this service for all blockchain operations.
"""

import os
import sys
from pathlib import Path
from functools import wraps

# Add src directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import logging
from datetime import datetime

from core.blockchain import Blockchain
from core.transaction import VoteTransaction, TransactionValidator

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Rate limiting
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["100 per 15 minutes"],
    storage_uri="memory://",
)

# Load configuration
app.config.from_mapping(
    SECRET_KEY=os.getenv('SECRET_KEY', 'dev-secret-key'),
    DIFFICULTY=int(os.getenv('BLOCKCHAIN_DIFFICULTY', 4)),
    DATABASE_URL=os.getenv('DATABASE_URL', 'sqlite:///blockchain.db'),
    REQUIRE_API_KEY=os.getenv('REQUIRE_API_KEY', 'False').lower() == 'true',
    ALLOWED_API_KEYS=set(os.getenv('API_KEYS', 'test-key-123').split(','))
)

# Initialize blockchain
blockchain = None

def get_blockchain():
    """Get or initialize blockchain instance."""
    global blockchain
    if blockchain is None:
        blockchain = Blockchain(
            difficulty=app.config['DIFFICULTY'],
            db_path=app.config['DATABASE_URL'].replace('sqlite:///', '')
        )
    return blockchain

def require_api_key():
    """Decorator to require API key for certain endpoints."""
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            if app.config['REQUIRE_API_KEY']:
                api_key = request.headers.get('X-API-Key') or request.args.get('api_key')
                if not api_key or api_key not in app.config['ALLOWED_API_KEYS']:
                    return jsonify({
                        'success': False,
                        'error': 'Invalid or missing API key'
                    }), 401
            return f(*args, **kwargs)
        return wrapper
    return decorator

def validate_vote_data(data):
    """Validate vote data from PHP backend."""
    required_fields = ['election_id', 'voter_id', 'candidate_id', 'vote_hash']
    
    for field in required_fields:
        if field not in data:
            return False, f"Missing required field: {field}"
    
    if not isinstance(data['election_id'], str):
        return False, "election_id must be string"
    
    if not isinstance(data['voter_id'], str):
        return False, "voter_id must be string"
    
    if not isinstance(data['candidate_id'], str):
        return False, "candidate_id must be string"
    
    if not isinstance(data.get('metadata', {}), dict):
        return False, "metadata must be dictionary"
    
    return True, "Validation passed"

@app.before_request
def log_request():
    """Log all incoming requests."""
    logger.info(f"{request.method} {request.path} - {request.remote_addr}")

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    bc = get_blockchain()
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'blockchain': {
            'chain_length': bc.get_chain_length(),
            'pending_transactions': len(bc.pending_transactions),
            'is_valid': bc.is_chain_valid()[0]
        }
    })

@app.route('/api/blockchain/stats', methods=['GET'])
@limiter.limit("60 per minute")
def get_blockchain_stats():
    """Get blockchain statistics."""
    try:
        bc = get_blockchain()
        stats = bc.get_chain_stats()
        
        return jsonify({
            'success': True,
            'data': stats,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Error getting blockchain stats: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/blockchain/blocks', methods=['GET'])
@limiter.limit("30 per minute")
def get_blocks():
    """Get blocks with pagination."""
    try:
        bc = get_blockchain()
        
        # Parse pagination parameters
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', request.args.get('perPage', 10)))
        
        start_idx = (page - 1) * per_page
        end_idx = start_idx + per_page
        
        blocks = bc.chain[start_idx:end_idx]
        blocks_data = [block.to_dict() for block in blocks]
        
        return jsonify({
            'success': True,
            'data': {
                'blocks': blocks_data,
                'page': page,
                'per_page': per_page,
                'total_blocks': len(bc.chain),
                'total_pages': (len(bc.chain) + per_page - 1) // per_page
            }
        })
    except Exception as e:
        logger.error(f"Error getting blocks: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/blockchain/blocks/<int:block_index>', methods=['GET'])
@limiter.limit("60 per minute")
def get_block(block_index):
    """Get specific block by index."""
    try:
        bc = get_blockchain()
        block = bc.get_block_by_index(block_index)
        
        if not block:
            return jsonify({
                'success': False,
                'error': f'Block {block_index} not found'
            }), 404
        
        return jsonify({
            'success': True,
            'data': block.to_dict()
        })
    except Exception as e:
        logger.error(f"Error getting block {block_index}: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/blockchain/transactions/submit', methods=['POST'])
@limiter.limit("10 per minute")  # Lower limit for transaction submission
@require_api_key()
def submit_transaction():
    """
    Submit a vote transaction from PHP backend.
    
    Expected JSON payload:
    {
        "election_id": "uuid",
        "voter_id": "uuid",
        "candidate_id": "uuid",
        "vote_hash": "hash_from_php",
        "metadata": {
            "session_id": "...",
            "ip_address": "..."
        }
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400
        
        # Validate input data
        is_valid, message = validate_vote_data(data)
        if not is_valid:
            return jsonify({
                'success': False,
                'error': message
            }), 400
        
        bc = get_blockchain()

        # Create a single transaction instance so IDs remain consistent
        transaction = VoteTransaction.from_dict(data)

        # Add to blockchain using the normalized transaction dict
        success, message = bc.add_transaction(transaction.to_dict())
        
        if success:
            logger.info(f"Transaction submitted: {transaction.transaction_id}")
            
            # Try to mine if we have enough transactions
            if len(bc.pending_transactions) >= 5:  # Mine every 5 transactions
                mined_block = bc.mine_pending_transactions(miner_address="voting_server")
                if mined_block:
                    logger.info(f"Mined block #{mined_block.index}")
            
            return jsonify({
                'success': True,
                'data': {
                    'transaction_id': transaction.transaction_id,
                    'vote_hash': transaction.vote_hash,
                    'timestamp': transaction.timestamp,
                    'status': 'pending',
                    'message': message
                }
            })
        else:
            return jsonify({
                'success': False,
                'error': message
            }), 400
            
    except Exception as e:
        logger.error(f"Error submitting transaction: {e}")
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500

@app.route('/api/blockchain/transactions/<transaction_id>', methods=['GET'])
@limiter.limit("60 per minute")
def get_transaction(transaction_id):
    """Get transaction by ID."""
    try:
        bc = get_blockchain()
        transaction = bc.get_transaction(transaction_id)
        
        if not transaction:
            return jsonify({
                'success': False,
                'error': f'Transaction {transaction_id} not found'
            }), 404
        
        return jsonify({
            'success': True,
            'data': transaction
        })
    except Exception as e:
        logger.error(f"Error getting transaction {transaction_id}: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/blockchain/validate', methods=['POST'])
@limiter.limit("30 per minute")
@require_api_key()
def validate_vote():
    """
    Validate if a vote exists in blockchain (for PHP verification).
    
    Expected JSON payload:
    {
        "election_id": "uuid",
        "voter_id": "uuid",
        "vote_hash": "hash_to_verify"
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400
        
        required_fields = ['election_id', 'voter_id', 'vote_hash']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        bc = get_blockchain()
        
        # Search for transaction
        found = False
        transaction_data = None
        block_index = None
        
        for i, block in enumerate(bc.chain):
            for tx in block.transactions:
                if (tx.get('type') == 'vote' and 
                    tx.get('election_id') == data['election_id'] and 
                    tx.get('voter_id') == data['voter_id'] and 
                    tx.get('vote_hash') == data['vote_hash']):
                    found = True
                    transaction_data = tx
                    block_index = i
                    break
            if found:
                break
        
        if found:
            return jsonify({
                'success': True,
                'data': {
                    'exists': True,
                    'transaction': transaction_data,
                    'block_index': block_index,
                    'confirmed': True
                }
            })
        else:
            # Check pending transactions
            for tx in bc.pending_transactions:
                if (tx.get('election_id') == data['election_id'] and 
                    tx.get('voter_id') == data['voter_id'] and 
                    tx.get('vote_hash') == data['vote_hash']):
                    return jsonify({
                        'success': True,
                        'data': {
                            'exists': True,
                            'transaction': tx,
                            'block_index': None,
                            'confirmed': False,
                            'status': 'pending'
                        }
                    })
            
            return jsonify({
                'success': True,
                'data': {
                    'exists': False,
                    'message': 'Vote not found in blockchain'
                }
            })
            
    except Exception as e:
        logger.error(f"Error validating vote: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/blockchain/mine', methods=['POST'])
@limiter.limit("5 per minute")  # Very low limit for mining
@require_api_key()
def mine_block():
    """Manually trigger block mining (for testing/admin)."""
    try:
        bc = get_blockchain()
        payload = request.get_json(silent=True) or {}
        miner_address = payload.get('miner_address', 'manual_miner')
        
        if not bc.pending_transactions:
            return jsonify({
                'success': False,
                'error': 'No pending transactions to mine'
            }), 400
        
        mined_block = bc.mine_pending_transactions(miner_address=miner_address)
        
        if mined_block:
            return jsonify({
                'success': True,
                'data': {
                    'block': mined_block.to_dict(),
                    'message': f'Block #{mined_block.index} mined successfully'
                }
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to mine block'
            }), 500
            
    except Exception as e:
        logger.error(f"Error mining block: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors."""
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404

@app.errorhandler(429)
def ratelimit_handler(error):
    """Handle rate limit errors."""
    return jsonify({
        'success': False,
        'error': 'Rate limit exceeded'
    }), 429

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors."""
    logger.error(f"Internal server error: {error}")
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500

if __name__ == '__main__':
    # Run Flask app
    host = os.getenv('HOST', '0.0.0.0')
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('DEBUG', 'False').lower() == 'true'
    
    logger.info(f"Starting blockchain API on {host}:{port}")
    app.run(host=host, port=port, debug=debug)