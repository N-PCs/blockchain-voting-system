"""
Blockchain module - Main blockchain implementation for voting system.
"""

import json
import time
import hashlib
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
import threading
import sqlite3
from pathlib import Path
import logging

from .block import Block
from .transaction import VoteTransaction, TransactionValidator

# Configure logging
logger = logging.getLogger(__name__)


class Blockchain:
    """
    Main blockchain class for the voting system.
    
    Features:
    - Chain validation
    - Transaction processing
    - Block mining
    - Double-spend prevention
    - Chain reorganization handling
    """
    
    def __init__(self, difficulty: int = 4, db_path: str = "blockchain.db"):
        """
        Initialize blockchain.
        
        Args:
            difficulty: Proof of Work difficulty
            db_path: Path to SQLite database file
        """
        self.difficulty = difficulty
        self.pending_transactions: List[Dict[str, Any]] = []
        self.mining_reward = 1
        self.db_path = db_path
        
        # Thread safety
        self.lock = threading.RLock()
        
        # Initialize database
        self._init_database()
        
        # Load or create genesis block
        self.chain = self.load_chain_from_db()
        if not self.chain:
            self.create_genesis_block()
        
        # Transaction validator
        self.validator = TransactionValidator(self)
        
        logger.info(f"Blockchain initialized with {len(self.chain)} blocks")

    def _init_database(self) -> None:
        """Initialize SQLite database for blockchain storage."""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS blocks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    block_index INTEGER UNIQUE NOT NULL,
                    timestamp REAL NOT NULL,
                    transactions TEXT NOT NULL,
                    previous_hash TEXT NOT NULL,
                    hash TEXT UNIQUE NOT NULL,
                    nonce INTEGER DEFAULT 0,
                    mined_by TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            conn.execute("""
                CREATE TABLE IF NOT EXISTS transactions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    transaction_id TEXT UNIQUE NOT NULL,
                    block_index INTEGER,
                    transaction_data TEXT NOT NULL,
                    status TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (block_index) REFERENCES blocks(block_index)
                )
            """)
            
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_blocks_hash ON blocks(hash)
            """)
            
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_transactions_id ON transactions(transaction_id)
            """)
            
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status)
            """)
            
            conn.commit()

    def create_genesis_block(self) -> None:
        """Create and store genesis block."""
        with self.lock:
            genesis_block = Block.create_genesis_block()
            self.chain = [genesis_block]
            self._save_block_to_db(genesis_block)
            logger.info("Genesis block created")

    def load_chain_from_db(self) -> List[Block]:
        """
        Load blockchain from database.
        
        Returns:
            List of blocks ordered by index
        """
        chain = []
        
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.execute(
                    "SELECT * FROM blocks ORDER BY block_index ASC"
                )
                
                for row in cursor:
                    block_data = {
                        'index': row['block_index'],
                        'timestamp': row['timestamp'],
                        'transactions': json.loads(row['transactions']),
                        'previous_hash': row['previous_hash'],
                        'hash': row['hash'],
                        'nonce': row['nonce'],
                        'mined_by': row['mined_by']
                    }
                    chain.append(Block.from_dict(block_data))
                
                logger.info(f"Loaded {len(chain)} blocks from database")
        except Exception as e:
            logger.error(f"Error loading chain from DB: {e}")
            chain = []
        
        return chain

    def _save_block_to_db(self, block: Block) -> None:
        """
        Save block to database.
        
        Args:
            block: Block to save
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute(
                    """
                    INSERT OR REPLACE INTO blocks 
                    (block_index, timestamp, transactions, previous_hash, hash, nonce, mined_by)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        block.index,
                        block.timestamp,
                        json.dumps(block.transactions, default=str),
                        block.previous_hash,
                        block.hash,
                        block.nonce,
                        block.mined_by
                    )
                )
                
                # Save transactions
                for tx in block.transactions:
                    if 'transaction_id' in tx:
                        conn.execute(
                            """
                            INSERT OR REPLACE INTO transactions 
                            (transaction_id, block_index, transaction_data, status)
                            VALUES (?, ?, ?, ?)
                            """,
                            (
                                tx['transaction_id'],
                                block.index,
                                json.dumps(tx, default=str),
                                'confirmed'
                            )
                        )
                
                conn.commit()
                logger.debug(f"Block {block.index} saved to database")
        except Exception as e:
            logger.error(f"Error saving block to DB: {e}")
            raise

    def get_latest_block(self) -> Block:
        """
        Get the latest block in the chain.
        
        Returns:
            Latest block
        """
        with self.lock:
            return self.chain[-1] if self.chain else None

    def get_chain_length(self) -> int:
        """
        Get current chain length.
        
        Returns:
            Number of blocks in chain
        """
        with self.lock:
            return len(self.chain)

    def add_transaction(self, transaction_data: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Add a transaction to pending transactions.
        
        Args:
            transaction_data: Transaction data
            
        Returns:
            Tuple of (success, message)
        """
        with self.lock:
            try:
                # Create transaction object
                transaction = VoteTransaction.from_dict(transaction_data)
                
                # Validate transaction
                is_valid, message = self.validator.validate_transaction(transaction)
                
                if not is_valid:
                    return False, message
                
                # Check for duplicate in pending transactions
                for pending_tx in self.pending_transactions:
                    if pending_tx.get('transaction_id') == transaction.transaction_id:
                        return False, "Transaction already in pending pool"
                
                # Add to pending transactions
                self.pending_transactions.append(transaction.to_dict())
                
                logger.info(f"Transaction {transaction.transaction_id} added to pending pool")
                return True, "Transaction added to pending pool"
                
            except Exception as e:
                logger.error(f"Error adding transaction: {e}")
                return False, f"Error: {str(e)}"

    def mine_pending_transactions(self, miner_address: str = "system") -> Optional[Block]:
        """
        Mine pending transactions into a new block.
        
        Args:
            miner_address: Address of the miner
            
        Returns:
            Newly mined block or None if failed
        """
        with self.lock:
            if not self.pending_transactions:
                logger.info("No transactions to mine")
                return None
            
            logger.info(f"Mining block with {len(self.pending_transactions)} transactions")
            
            # Create coinbase transaction (mining reward)
            coinbase_tx = {
                'type': 'coinbase',
                'from': 'network',
                'to': miner_address,
                'amount': self.mining_reward,
                'timestamp': time.time(),
                'transaction_id': f"cb_{int(time.time())}_{secrets.token_hex(4)}"
            }
            
            # Combine coinbase with pending transactions
            all_transactions = [coinbase_tx] + self.pending_transactions
            
            # Create new block
            previous_block = self.get_latest_block()
            new_block = Block(
                index=previous_block.index + 1,
                timestamp=time.time(),
                transactions=all_transactions,
                previous_hash=previous_block.hash,
                mined_by=miner_address
            )
            
            # Mine the block (Proof of Work)
            start_time = time.time()
            new_block.mine_block(self.difficulty)
            mining_time = time.time() - start_time
            
            # Add block to chain
            self.chain.append(new_block)
            
            # Save to database
            self._save_block_to_db(new_block)
            
            # Clear pending transactions
            self.pending_transactions = []
            
            logger.info(
                f"Block #{new_block.index} mined by {miner_address} "
                f"in {mining_time:.2f}s with hash {new_block.hash[:16]}..."
            )
            
            return new_block

    def is_chain_valid(self) -> Tuple[bool, str]:
        """
        Validate the entire blockchain.
        
        Returns:
            Tuple of (is_valid, error_message)
        """
        with self.lock:
            if not self.chain:
                return False, "Empty chain"
            
            # Check genesis block
            genesis = self.chain[0]
            if genesis.index != 0:
                return False, "First block must be genesis (index 0)"
            
            if not genesis.is_valid(self.difficulty):
                return False, "Genesis block is invalid"
            
            # Validate each block
            for i in range(1, len(self.chain)):
                current_block = self.chain[i]
                previous_block = self.chain[i - 1]
                
                # Validate block structure
                if not current_block.is_valid(self.difficulty):
                    return False, f"Block {current_block.index} has invalid structure"
                
                # Check chain linkage
                if current_block.previous_hash != previous_block.hash:
                    return False, f"Block {current_block.index} has invalid previous hash"
                
                # Check block index order
                if current_block.index != previous_block.index + 1:
                    return False, f"Block index mismatch at block {current_block.index}"
                
                # Validate transactions in block
                for tx in current_block.transactions:
                    if tx.get('type') == 'vote':
                        transaction = VoteTransaction.from_dict(tx)
                        is_valid, msg = self.validator.validate_transaction(transaction)
                        if not is_valid:
                            return False, f"Invalid transaction {tx.get('transaction_id')} in block {current_block.index}: {msg}"
            
            return True, "Chain is valid"

    def get_block_by_index(self, index: int) -> Optional[Block]:
        """
        Get block by index.
        
        Args:
            index: Block index
            
        Returns:
            Block if found, None otherwise
        """
        with self.lock:
            if 0 <= index < len(self.chain):
                return self.chain[index]
            return None

    def get_block_by_hash(self, block_hash: str) -> Optional[Block]:
        """
        Get block by hash.
        
        Args:
            block_hash: Block hash
            
        Returns:
            Block if found, None otherwise
        """
        with self.lock:
            for block in self.chain:
                if block.hash == block_hash:
                    return block
            return None

    def get_transaction(self, transaction_id: str) -> Optional[Dict[str, Any]]:
        """
        Find a transaction by ID.
        
        Args:
            transaction_id: Transaction ID
            
        Returns:
            Transaction data if found, None otherwise
        """
        with self.lock:
            # Check pending transactions
            for tx in self.pending_transactions:
                if tx.get('transaction_id') == transaction_id:
                    return tx
            
            # Check confirmed transactions in blocks
            for block in self.chain:
                for tx in block.transactions:
                    if tx.get('transaction_id') == transaction_id:
                        return tx
            
            return None

    def get_balance(self, address: str) -> float:
        """
        Get balance for an address (for mining rewards).
        
        Args:
            address: Address to check
            
        Returns:
            Balance in tokens
        """
        with self.lock:
            balance = 0.0
            
            for block in self.chain:
                for tx in block.transactions:
                    if tx.get('type') == 'coinbase' and tx.get('to') == address:
                        balance += tx.get('amount', 0)
            
            return balance

    def get_chain_stats(self) -> Dict[str, Any]:
        """
        Get blockchain statistics.
        
        Returns:
            Dictionary with chain statistics
        """
        with self.lock:
            total_transactions = 0
            vote_transactions = 0
            
            for block in self.chain:
                for tx in block.transactions:
                    total_transactions += 1
                    if tx.get('type') == 'vote':
                        vote_transactions += 1
            
            latest_block = self.get_latest_block()
            
            return {
                'chain_length': len(self.chain),
                'difficulty': self.difficulty,
                'pending_transactions': len(self.pending_transactions),
                'total_transactions': total_transactions,
                'vote_transactions': vote_transactions,
                'latest_block_index': latest_block.index if latest_block else 0,
                'latest_block_hash': latest_block.hash[:16] + '...' if latest_block else '',
                'mining_reward': self.mining_reward,
                'is_valid': self.is_chain_valid()[0]
            }

    def replace_chain(self, new_chain: List[Block]) -> bool:
        """
        Replace current chain with new chain if valid and longer.
        
        Args:
            new_chain: New blockchain to consider
            
        Returns:
            True if chain was replaced
        """
        with self.lock:
            # Validate new chain
            temp_blockchain = Blockchain(difficulty=self.difficulty, db_path=self.db_path + ".temp")
            temp_blockchain.chain = new_chain
            
            is_valid, message = temp_blockchain.is_chain_valid()
            if not is_valid:
                logger.warning(f"Invalid chain received: {message}")
                return False
            
            # Check if new chain is longer
            if len(new_chain) <= len(self.chain):
                logger.info("Received chain is not longer than current chain")
                return False
            
            # Replace chain
            self.chain = new_chain
            
            # Save to database
            with sqlite3.connect(self.db_path) as conn:
                conn.execute("DELETE FROM blocks")
                conn.commit()
            
            for block in new_chain:
                self._save_block_to_db(block)
            
            logger.info(f"Chain replaced. New length: {len(self.chain)}")
            return True