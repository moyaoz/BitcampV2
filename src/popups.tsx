import { useState, useRef } from 'react';

const WebcamToggle = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [handDetected, setHandDetected] = useState<boolean | null>(null); // <-- NEW
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsStreaming(true);

      intervalRef.current = setInterval(captureAndSendFrame, 200);
    } catch (error) {
      console.error("Error accessing webcam: ", error);
    }
  };

  const stopWebcam = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsStreaming(false);
    setHandDetected(null); // Reset on stop
  };

  const captureAndSendFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg'));

    if (blob) {
      const formData = new FormData();
      formData.append('image', blob, 'frame.jpg');

      try {
        const response = await fetch('http://localhost:5001/detect_hand', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();
        console.log('Hand detection result:', data);

        // 👇 Update hand detected status
        setHandDetected(data.hand_detected ?? false);
      } catch (error) {
        console.error('Error sending frame:', error);
      }
    }
  };

  const toggleWebcam = () => {
    if (!isStreaming) {
      startWebcam();
    } else {
      stopWebcam();
    }
  };

  return (
    <>
      <button id="openCamera" onClick={toggleWebcam}>
        {!isStreaming ? 'Start' : 'Stop'} video
      </button>

      {isStreaming && (
        <>
          <video
            width={200}
            height={150}
            autoPlay
            ref={videoRef}
            style={{ transform: "scaleX(-1)", marginTop: "10px" }}
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* 👇 Show hand detection result */}
          {handDetected !== null && (
            <div style={{ marginTop: '10px', fontWeight: 'bold' }}>
              {handDetected ? (
                <span style={{ color: 'green' }}>Hand detected ✅</span>
              ) : (
                <span style={{ color: 'red' }}>No hand detected ❌</span>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
};

export default WebcamToggle;
