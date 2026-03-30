from datetime import datetime
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

session_logs = []

BASE_RESPONSES = {
    'Engaged': {
        'action': 'continue',
        'message': 'You are engaged. Keep the momentum and increase the challenge.',
        'difficulty': 'hard',
    },
    'Normal': {
        'action': 'continue',
        'message': 'You are doing well. Continue at the current pace.',
        'difficulty': 'medium',
    },
    'Confused': {
        'action': 'hint',
        'message': 'You seem confused. Here is a simplified hint to help you focus.',
        'difficulty': 'easy',
    },
    'Stressed': {
        'action': 'slow',
        'message': 'You look stressed. Slow down and take a short break if needed.',
        'difficulty': 'easy',
    },
}


@app.route('/emotion', methods=['POST'])
def emotion():
    data = request.get_json(force=True)
    emotion = data.get('emotion')
    if not emotion or emotion not in BASE_RESPONSES:
        return jsonify({'error': 'Invalid emotion value provided.'}), 400

    response = BASE_RESPONSES[emotion]
    return jsonify(response)


@app.route('/session-data', methods=['POST'])
def session_data():
    data = request.get_json(force=True)
    emotion = data.get('emotion')
    action = data.get('action')
    difficulty = data.get('difficulty')
    timestamp = data.get('timestamp') or datetime.utcnow().isoformat()

    entry = {
        'emotion': emotion,
        'action': action,
        'difficulty': difficulty,
        'timestamp': timestamp,
    }
    session_logs.append(entry)
    return jsonify({'status': 'ok', 'entry': entry})


@app.route('/analytics', methods=['GET'])
def analytics():
    total_events = len(session_logs)
    counts = {
        'Engaged': 0,
        'Normal': 0,
        'Confused': 0,
        'Stressed': 0,
    }
    for entry in session_logs:
        emotion = entry.get('emotion')
        if emotion in counts:
            counts[emotion] += 1

    most_frequent = max(counts.items(), key=lambda item: item[1])[0] if total_events else 'Normal'
    engagement_score = counts['Engaged'] + counts['Normal'] - counts['Confused'] - counts['Stressed']

    spikes = [
        {
            'emotion': entry['emotion'],
            'timestamp': entry['timestamp'],
        }
        for entry in session_logs
        if entry.get('emotion') in ('Confused', 'Stressed')
    ]

    return jsonify({
        'totalEvents': total_events,
        'counts': counts,
        'mostFrequentEmotion': most_frequent,
        'engagementScore': engagement_score,
        'spikes': spikes[-10:],
    })


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
