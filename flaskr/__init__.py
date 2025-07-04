import datetime
import os

from flask import Flask, jsonify, request
from flask_pymongo import PyMongo

mongo = PyMongo()


def create_app(test_config=None):
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_mapping(
        SECRET_KEY=os.environ.get('SECRET_KEY', 'dev'),
        MONGO_URI=os.environ.get('MONGO_URI', 'mongodb://localhost:27017/server_performance_monitor')
    )

    if test_config is None:
        app.config.from_pyfile('config.py', silent=True)
    else:
        app.config.from_mapping(test_config)

    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    mongo.init_app(app)

    @app.route('/status')
    def status():
        return jsonify({
            'timestamp': datetime.datetime.now(datetime.UTC).isoformat(),
            'status': 200,
            'message': 'OK'
        }), 200

    @app.route('/system-metrics', methods=['GET'])
    def get_system_metrics():
        system_metrics = list(mongo.db.system_metrics.find())
        return jsonify(system_metrics), 200

    @app.route('/system-metrics', methods=['POST'])
    def create_system_metrics():
        system_metrics_data = request.json
        inserted_system_metrics = mongo.db.system_metrics.insert_one(system_metrics_data)
        created_system_metrics = mongo.db.system_metrics.find_one({'_id': inserted_system_metrics.inserted_id})
        created_system_metrics['_id'] = str(created_system_metrics['_id'])
        return jsonify({
            'timestamp': datetime.datetime.now(datetime.UTC).isoformat(),
            'status': 201,
            'message': 'Created',
            'resource': created_system_metrics
        }), 201

    return app
