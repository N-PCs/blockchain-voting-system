#!/usr/bin/env python3
"""
Entry point for blockchain voting system service.
"""

import os
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / 'src'))

from api.app import app

if __name__ == '__main__':
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    # Run the application
    host = os.getenv('HOST', '0.0.0.0')
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('DEBUG', 'False').lower() == 'true'
    
    print(f"Starting Blockchain Voting Service on {host}:{port}")
    print(f"Debug mode: {debug}")
    print(f"Environment: {os.getenv('APP_ENV', 'development')}")
    
    app.run(host=host, port=port, debug=debug)