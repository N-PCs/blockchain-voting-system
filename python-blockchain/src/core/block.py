"""
Block module - Defines the Block data structure and validation logic.
"""

import hashlib
import json
import time
from datetime import datetime
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, asdict
import secrets


@dataclass
class Block:
    """
    Block data structure for the voting blockchain.
    
    Attributes:
        index: Position in the blockchain (0 = genesis)
        timestamp: Unix timestamp of block creation
        transactions: List of vote transactions
        previous_hash: Hash of previous block
        nonce: Number used for Proof of Work
        hash: Current block's cryptographic hash
        mined_by: Node/address that mined this block
    """
    index: int
    timestamp: float
    transactions: List[Dict[str, Any]]
    previous_hash: str
    nonce: int = 0
    hash: str = ""
    mined_by: str = ""

    def __post_init__(self) -> None:
        """Calculate hash after initialization if not provided."""
        if not self.hash:
            self.hash = self.calculate_hash()

    def calculate_hash(self) -> str:
        """
        Calculate SHA-256 hash of the block.
        
        Returns:
            Hexadecimal string of the block hash
        """
        block_string = json.dumps({
            'index': self.index,
            'timestamp': self.timestamp,
            'transactions': self.transactions,
            'previous_hash': self.previous_hash,
            'nonce': self.nonce
        }, sort_keys=True, default=str)
        
        return hashlib.sha256(block_string.encode()).hexdigest()

    def to_dict(self) -> Dict[str, Any]:
        """
        Convert block to dictionary.
        
        Returns:
            Dictionary representation of the block
        """
        return {
            'index': self.index,
            'timestamp': self.timestamp,
            'formatted_time': datetime.fromtimestamp(self.timestamp).isoformat(),
            'transactions': self.transactions,
            'previous_hash': self.previous_hash,
            'hash': self.hash,
            'nonce': self.nonce,
            'mined_by': self.mined_by,
            'transaction_count': len(self.transactions)
        }

    def to_json(self) -> str:
        """
        Convert block to JSON string.
        
        Returns:
            JSON string representation
        """
        return json.dumps(self.to_dict(), indent=2)

    def is_valid(self, difficulty: int = 4) -> bool:
        """
        Validate block structure and hash.
        
        Args:
            difficulty: Number of leading zeros required in hash
            
        Returns:
            True if block is valid
        """
        # Check hash matches calculated hash
        if self.hash != self.calculate_hash():
            return False

        # Check proof of work (genesis block does not require PoW)
        if self.index != 0 and not self.hash.startswith('0' * difficulty):
            return False

        # Validate index
        if self.index < 0:
            return False

        # Validate timestamp (not in future, not too far in past)
        current_time = time.time()
        if self.timestamp > current_time + 60:  # 1 minute in future tolerance
            return False
        if self.timestamp < current_time - 31536000:  # 1 year in past tolerance
            return False

        # Validate previous hash format
        if self.index > 0 and not self.previous_hash:  # Non-genesis must have previous hash
            return False
        if self.index == 0 and self.previous_hash != '0' * 64:  # Genesis has special previous hash
            return False

        # Validate hash format (64 hex chars)
        if len(self.hash) != 64 or not all(c in '0123456789abcdef' for c in self.hash):
            return False

        # Validate transactions
        if not isinstance(self.transactions, list):
            return False

        return True

    def mine_block(self, difficulty: int = 4) -> None:
        """
        Mine the block using Proof of Work.
        
        Args:
            difficulty: Number of leading zeros required
        """
        target = '0' * difficulty
        
        while True:
            self.hash = self.calculate_hash()
            if self.hash.startswith(target):
                break
            self.nonce += 1

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Block':
        """
        Create Block instance from dictionary.
        
        Args:
            data: Dictionary containing block data
            
        Returns:
            Block instance
        """
        return cls(
            index=data['index'],
            timestamp=data['timestamp'],
            transactions=data['transactions'],
            previous_hash=data['previous_hash'],
            nonce=data.get('nonce', 0),
            hash=data.get('hash', ''),
            mined_by=data.get('mined_by', '')
        )

    @classmethod
    def create_genesis_block(cls) -> 'Block':
        """
        Create the genesis block (first block in chain).
        
        Returns:
            Genesis block
        """
        genesis_transactions = [{
            'type': 'genesis',
            'message': 'Initial block for voting system blockchain',
            'timestamp': time.time(),
            'creator': 'system'
        }]
        
        genesis_block = cls(
            index=0,
            timestamp=time.time(),
            transactions=genesis_transactions,
            previous_hash='0' * 64,  # Standard genesis previous hash
            mined_by='system'
        )
        
        # Genesis block doesn't need proof of work
        genesis_block.hash = genesis_block.calculate_hash()
        
        return genesis_block

    def get_merkle_root(self) -> str:
        """
        Calculate Merkle root of transactions.
        
        Returns:
            Merkle root hash
        """
        if not self.transactions:
            return hashlib.sha256(b'').hexdigest()
        
        # Convert transactions to strings and hash them
        transaction_hashes = [
            hashlib.sha256(json.dumps(tx, sort_keys=True, default=str).encode()).hexdigest()
            for tx in self.transactions
        ]
        
        # Build Merkle tree
        while len(transaction_hashes) > 1:
            if len(transaction_hashes) % 2 != 0:
                transaction_hashes.append(transaction_hashes[-1])
            
            new_hashes = []
            for i in range(0, len(transaction_hashes), 2):
                combined = transaction_hashes[i] + transaction_hashes[i + 1]
                new_hash = hashlib.sha256(combined.encode()).hexdigest()
                new_hashes.append(new_hash)
            
            transaction_hashes = new_hashes
        
        return transaction_hashes[0] if transaction_hashes else ''