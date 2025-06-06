"""
Card Payment Processing Server

This Flask application demonstrates card payment processing using the Global Payments SDK.
It provides endpoints for configuration and payment processing, handling tokenized card data
to ensure secure payment processing.

The server provides two main endpoints:
- /config: Returns the public API key for client-side tokenization
- /process-payment: Processes card payments using tokenized data

Author: Global Payments
License: MIT
"""

import os
import re
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from globalpayments.api import PorticoConfig, ServicesContainer
from globalpayments.api.payment_methods import CreditCardData
from globalpayments.api.entities import Address
from globalpayments.api.entities.exceptions import ApiException

# Initialize application
app = Flask(__name__, static_folder='.')

def configure_sdk():
    """
    Configure the Global Payments SDK with necessary credentials and settings.
    This must be called before processing any payments.
    """
    config = PorticoConfig()
    # Set secret API key for server-side operations
    config.secret_api_key = os.getenv('SECRET_API_KEY')
    # Set API endpoint URL - using certification environment
    config.service_url = 'https://cert.api2.heartlandportico.com'
    # Developer identification used by Global Payments
    config.developer_id = '000000'
    config.version_number = '0000'
    
    ServicesContainer.configure(config)

# Configure SDK on startup
configure_sdk()

def sanitize_postal_code(postal_code: str) -> str:
    """
    Sanitize postal code input by removing invalid characters.
    
    Args:
        postal_code (str): The postal code to sanitize.
            Can be a US format (12345 or 12345-6789) or international format.
    
    Returns:
        str: The sanitized postal code, containing only alphanumeric characters
            and hyphens, limited to 10 characters.
    """
    sanitized = re.sub(r'[^a-zA-Z0-9-]', '', postal_code or '')
    return sanitized[:10]

@app.route('/')
def index():
    """Serve the main payment form HTML page."""
    return app.send_static_file('index.html')

@app.route('/config')
def get_config():
    """
    Provide the public API key for client-side tokenization.
    This key is used by the frontend to tokenize card data securely.
    
    Returns:
        JSON response containing the public API key.
    """
    return jsonify({
        'success': True,
        'data': {
            'publicApiKey': os.getenv('PUBLIC_API_KEY')
        }
    })

@app.route('/process-payment', methods=['POST'])
def process_payment():
    """
    Process a card payment using tokenized card data.
    
    Expected form data:
        payment_token (str): Token representing the card data
        billing_zip (str): Postal code for AVS verification
    
    Returns:
        JSON response with transaction result or error message
    """
    try:
        # Validate required fields
        if 'payment_token' not in request.form or 'billing_zip' not in request.form:
            raise ApiException('Missing required fields')

        # Create card data object with the token from client-side tokenization
        card = CreditCardData()
        card.token = request.form['payment_token']

        # Create address object for AVS verification
        address = Address()
        address.postal_code = sanitize_postal_code(request.form['billing_zip'])

        # Process a $10 USD charge
        # Including billing address for additional verification
        response = card.charge(10)\
            .with_currency('USD')\
            .with_address(address)\
            .execute()

        # Check for successful response code
        if response.response_code != '00':
            return jsonify({
                'success': False,
                'message': 'Payment processing failed',
                'error': {
                    'code': 'PAYMENT_DECLINED',
                    'details': response.response_message
                }
            }), 400

        # Return success response with transaction ID
        return jsonify({
            'success': True,
            'message': f'Payment successful! Transaction ID: {response.transaction_id}',
            'data': {
                'transactionId': response.transaction_id
            }
        })
    except ApiException as e:
        # Handle API-specific exceptions and return error response
        return jsonify({
            'success': False,
            'message': 'Payment processing failed',
            'error': {
                'code': 'API_ERROR',
                'details': str(e)
            }
        }), 400
    except Exception as e:
        # Handle general errors
        return jsonify({
            'success': False,
            'message': 'Internal server error',
            'error': {
                'code': 'SERVER_ERROR',
                'details': str(e)
            }
        }), 500

# Start the server if this file is run directly
if __name__ == '__main__':
    port = int(os.getenv('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=True)  # Running in debug mode for development
