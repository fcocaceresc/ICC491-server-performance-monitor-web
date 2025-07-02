import datetime

from flask import Flask, jsonify


def create_app():
    app = Flask(__name__)

    @app.route('/status')
    def status():
        return jsonify({
            'timestamp': datetime.datetime.now(datetime.UTC).isoformat(),
            'status': 200,
            'message': 'OK'
        }), 200

    return app
