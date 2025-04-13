from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import mediapipe as mp

app = Flask(__name__)
CORS(app)  # Allow requests from your Chrome extension

# Initialize MediaPipe Hands
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(static_image_mode=False, max_num_hands=2, min_detection_confidence=0.5)

@app.route('/')
def index():
    return 'Welcome to the SignToText API!'

@app.route('/detect_hand', methods=['POST'])
def detect_hand():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
    
    file = request.files['image']
    img_bytes = file.read()
    
    # Convert the image to a NumPy array
    np_img = np.frombuffer(img_bytes, np.uint8)
    
    # Decode the image to get OpenCV format
    img = cv2.imdecode(np_img, cv2.IMREAD_COLOR)
    
    # Convert the image to RGB (MediaPipe uses RGB format)
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    # Process the image for hand detection
    results = hands.process(img_rgb)

    # Check if hands were detected
    if results.multi_hand_landmarks:
        print("Hand detected")
        return jsonify({'hand_detected': True})
    else:
        print("No hand detected")
        return jsonify({'hand_detected': False})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
