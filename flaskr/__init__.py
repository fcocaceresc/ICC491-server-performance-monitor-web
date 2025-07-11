import datetime
import os

from flask import Flask, jsonify, request, render_template
from flask_pymongo import PyMongo
from flask_socketio import SocketIO

mongo = PyMongo()

socketio = SocketIO()


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

    socketio.init_app(app)

    @app.route('/status')
    def status():
        return jsonify({
            'timestamp': datetime.datetime.now(datetime.UTC).isoformat(),
            'status': 200,
            'message': 'OK'
        }), 200

    @app.route('/system-metrics', methods=['GET'])
    def get_system_metrics():
        limit = request.args.get('limit', type=int, default=10)
        system_metrics = list(mongo.db.system_metrics.find().sort('_id', -1).limit(limit))
        system_metrics.reverse()
        return jsonify(system_metrics), 200

    @app.route('/system-metrics', methods=['POST'])
    def create_system_metrics():
        system_metrics_data = request.json
        inserted_system_metrics = mongo.db.system_metrics.insert_one(system_metrics_data)
        created_system_metrics = mongo.db.system_metrics.find_one({'_id': inserted_system_metrics.inserted_id})
        created_system_metrics['_id'] = str(created_system_metrics['_id'])

        socketio.emit('new_system_metrics')

        return jsonify({
            'timestamp': datetime.datetime.now(datetime.UTC).isoformat(),
            'status': 201,
            'message': 'Created',
            'resource': created_system_metrics
        }), 201

    @app.route('/logs', methods=['GET'])
    def get_logs():
        limit = request.args.get('limit', type=int, default=10)
        logs = list(mongo.db.logs.find().sort('_id', -1).limit(limit))
        logs.reverse()
        return jsonify(logs), 200

    @app.route('/logs', methods=['POST'])
    def create_log():
        log_data = request.json
        if isinstance(log_data, list):
            result = mongo.db.logs.insert_many(log_data)
            created_logs = list(mongo.db.logs.find({'_id': {'$in': result.inserted_ids}}))

            socketio.emit('new_logs')

            for log in created_logs:
                log['_id'] = str(log['_id'])
            return jsonify({
                'timestamp': datetime.datetime.now(datetime.UTC).isoformat(),
                'status': 201,
                'message': 'Created',
                'resource': created_logs
            }), 201
        else:
            inserted_log = mongo.db.logs.insert_one(log_data)
            created_log = mongo.db.logs.find_one({'_id': inserted_log.inserted_id})
            created_log['_id'] = str(created_log['_id'])
            return jsonify({
                'timestamp': datetime.datetime.now(datetime.UTC).isoformat(),
                'status': 201,
                'message': 'Created',
                'resource': created_log
            }), 201

    @app.route('/processes-snapshots', methods=['GET'])
    def get_processes_snapshots():
        processes_snapshot = list(mongo.db.processes.find().sort('_id', -1).limit(1))
        return jsonify(processes_snapshot), 200

    @app.route('/processes-snapshots', methods=['POST'])
    def create_processes_snapshot():
        processes_snapshot_data = request.json
        inserted_process_snapshot = mongo.db.processes.insert_one(processes_snapshot_data)
        created_process_snapshot = mongo.db.processes.find_one({'_id': inserted_process_snapshot.inserted_id})
        created_process_snapshot['_id'] = str(created_process_snapshot['_id'])

        socketio.emit('new_processes_snapshot')

        return jsonify({
            'timestamp': datetime.datetime.now(datetime.UTC).isoformat(),
            'status': 201,
            'message': 'Created',
            'resource': created_process_snapshot
        }), 201

    @app.route('/', methods=['GET'])
    def dashboard():
        return render_template('dashboard.html')

    return app
