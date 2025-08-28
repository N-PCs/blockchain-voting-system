import hashlib
import json
import time

class Blockchain:
    def __init__(self):
        self.chain = []
        self.pending_votes = []  # List of pending votes (transactions)
        self.voted_voters = set()  # Set to track hashed voter IDs to prevent double-voting
        self.candidates = ["Candidate A", "Candidate B", "Candidate C"]  # Example candidates
        self.create_genesis_block()

    def create_genesis_block(self):
        # Create the first block (genesis) with a dummy vote
        genesis_block = self.create_block(previous_hash='0', proof=100)
        self.chain.append(genesis_block)

    def create_block(self, proof, previous_hash):
        block = {
            'index': len(self.chain) + 1,
            'timestamp': time.time(),
            'votes': self.pending_votes,  # Transactions (votes) in this block
            'proof': proof,
            'previous_hash': previous_hash
        }
        self.pending_votes = []  # Reset pending votes after adding to block
        return block

    def get_last_block(self):
        return self.chain[-1]

    def proof_of_work(self, last_proof):
        # Simple Proof of Work: Find a number that when hashed with last_proof gives a hash starting with '0000'
        proof = 0
        while not self.valid_proof(last_proof, proof):
            proof += 1
        return proof

    @staticmethod
    def valid_proof(last_proof, proof):
        guess = f'{last_proof}{proof}'.encode()
        guess_hash = hashlib.sha256(guess).hexdigest()
        return guess_hash[:4] == "0000"  # Difficulty level (4 leading zeros)

    def hash_block(self, block):
        # Hash the block for integrity
        block_string = json.dumps(block, sort_keys=True).encode()
        return hashlib.sha256(block_string).hexdigest()

    def mine_block(self):
        # Mine a new block with pending votes
        last_block = self.get_last_block()
        last_proof = last_block['proof']
        proof = self.proof_of_work(last_proof)
        previous_hash = self.hash_block(last_block)
        block = self.create_block(proof, previous_hash)
        self.chain.append(block)
        return block

    def add_vote(self, voter_id, candidate):
        # Anonymize voter_id with hashing
        hashed_voter_id = hashlib.sha256(voter_id.encode()).hexdigest()
        
        # Check for double-voting
        if hashed_voter_id in self.voted_voters:
            raise ValueError("This voter has already voted.")
        
        # Validate candidate
        if candidate not in self.candidates:
            raise ValueError("Invalid candidate.")
        
        # Add vote to pending
        self.pending_votes.append({
            'voter_hash': hashed_voter_id,
            'candidate': candidate
        })
        self.voted_voters.add(hashed_voter_id)
        return len(self.chain) + 1  # Next block index where vote will be mined

    def is_chain_valid(self):
        # Validate the entire chain for tampering
        for i in range(1, len(self.chain)):
            current_block = self.chain[i]
            previous_block = self.chain[i-1]
            
            # Check hash link
            if current_block['previous_hash'] != self.hash_block(previous_block):
                return False
            
            # Check proof
            if not self.valid_proof(previous_block['proof'], current_block['proof']):
                return False
        return True

    def get_results(self):
        # Tally votes from the chain
        results = {candidate: 0 for candidate in self.candidates}
        for block in self.chain:
            for vote in block['votes']:
                results[vote['candidate']] += 1
        return results