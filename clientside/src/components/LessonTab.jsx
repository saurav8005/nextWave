import React, { useState, useEffect, useRef } from 'react';
import { styles } from '../styles';

export default function LessonTab() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const animationFrameRef = useRef(null);

  const [videoDevices, setVideoDevices] = useState([]);
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedVideoId, setSelectedVideoId] = useState('');
  const [selectedAudioId, setSelectedAudioId] = useState('');

  const [streamActive, setStreamActive] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const [videoDisabled, setVideoDisabled] = useState(false);
  const [micVolume, setMicVolume] = useState(0);
  const [cameraError, setCameraError] = useState('');

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordedChunksRef = useRef([]);

  const enumerateDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');
      const audioInputs = devices.filter((d) => d.kind === 'audioinput');

      setVideoDevices(videoInputs);
      setAudioDevices(audioInputs);

      if (videoInputs.length && !selectedVideoId) setSelectedVideoId(videoInputs[0].deviceId);
      if (audioInputs.length && !selectedAudioId) setSelectedAudioId(audioInputs[0].deviceId);
    } catch (err) {
      console.warn('Could not enumerate devices:', err);
    }
  };

  const startCamera = async (videoId = selectedVideoId, audioId = selectedAudioId) => {
    stopCurrentTracks();
    setCameraError('');

    try {
      const constraints = {
        video: videoId
          ? { deviceId: { exact: videoId }, width: { ideal: 1920 }, height: { ideal: 1080 } }
          : { facingMode: 'user', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: audioId ? { deviceId: { exact: audioId } } : true,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = mediaStream;

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      setStreamActive(true);
      setVideoDisabled(false);
      setAudioMuted(false);

      setupVolumeMeter(mediaStream);
      await enumerateDevices();
    } catch (err) {
      console.error('Camera startup failed:', err);
      setStreamActive(false);
      setCameraError(
        `${err.name}: ${err.message}. Please check that your browser has permission to access your camera and microphone.`
      );
    }
  };

  const setupVolumeMeter = (stream) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioCtx();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        let values = 0;
        for (let i = 0; i < dataArray.length; i++) {
          values += dataArray[i];
        }
        const average = values / dataArray.length;
        setMicVolume(Math.min(100, Math.round((average / 128) * 100)));
        animationFrameRef.current = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (e) {
      console.warn('Audio metering unavailable:', e);
    }
  };

  const stopCurrentTracks = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStreamActive(false);
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCurrentTracks();
    };
  }, []);

  const toggleAudio = () => {
    if (!streamRef.current) return;
    const audioTrack = streamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setAudioMuted(!audioTrack.enabled);
    }
  };

  const toggleVideo = () => {
    if (!streamRef.current) return;
    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setVideoDisabled(!videoTrack.enabled);
    }
  };

  const handleVideoDeviceChange = (e) => {
    const newId = e.target.value;
    setSelectedVideoId(newId);
    startCamera(newId, selectedAudioId);
  };

  const handleAudioDeviceChange = (e) => {
    const newId = e.target.value;
    setSelectedAudioId(newId);
    startCamera(selectedVideoId, newId);
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    recordedChunksRef.current = [];

    const recorder = new MediaRecorder(streamRef.current, {
      mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm',
    });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lesson-recording-${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
    };

    recorder.start(1000);
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
    setRecordingSeconds(0);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  useEffect(() => {
    let timer = null;
    if (isRecording) {
      timer = setInterval(() => setRecordingSeconds((sec) => sec + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100dvh',
        margin: 0,
        backgroundColor: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Top Header Bar */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 20px',
          backgroundColor: '#1e293b',
          borderBottom: '1px solid #334155',
          flexShrink: 0,
          zIndex: 10,
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>
            Hardware Studio
          </h2>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              padding: '2px 10px',
              borderRadius: 999,
              backgroundColor: streamActive ? '#14532d' : '#7f1d1d',
              color: streamActive ? '#86efac' : '#fca5a5',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: streamActive ? '#22c55e' : '#ef4444',
              }}
            />
            {streamActive ? 'Live' : 'Offline'}
          </span>
        </div>

        {/* Device Selectors & Audio Meter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>Cam</span>
            <select
              style={{
                ...styles.select,
                backgroundColor: '#0f172a',
                color: '#f8fafc',
                border: '1px solid #334155',
                maxWidth: 160,
              }}
              value={selectedVideoId}
              onChange={handleVideoDeviceChange}
            >
              {videoDevices.map((d, i) => (
                <option key={d.deviceId || i} value={d.deviceId}>
                  {d.label || `Camera ${i + 1}`}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>Mic</span>
            <select
              style={{
                ...styles.select,
                backgroundColor: '#0f172a',
                color: '#f8fafc',
                border: '1px solid #334155',
                maxWidth: 160,
              }}
              value={selectedAudioId}
              onChange={handleAudioDeviceChange}
            >
              {audioDevices.map((d, i) => (
                <option key={d.deviceId || i} value={d.deviceId}>
                  {d.label || `Mic ${i + 1}`}
                </option>
              ))}
            </select>
          </div>

          {/* Level indicator */}
          <div
            title={`Mic Level: ${audioMuted ? 'Muted' : `${micVolume}%`}`}
            style={{
              width: 50,
              height: 10,
              backgroundColor: '#334155',
              borderRadius: 6,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${audioMuted ? 0 : micVolume}%`,
                height: '100%',
                backgroundColor: micVolume > 70 ? '#ef4444' : '#22c55e',
                transition: 'width 0.05s ease',
              }}
            />
          </div>
        </div>
      </header>

      {/* Main Viewport Container */}
      <div
        style={{
          position: 'relative',
          flex: 1,
          minHeight: 0,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#020617',
          overflow: 'hidden',
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'scaleX(-1)',
            display: videoDisabled ? 'none' : 'block',
          }}
        />

        {videoDisabled && (
          <div style={{ color: '#64748b', fontSize: 15, fontWeight: 500, zIndex: 1 }}>
            Webcam input paused
          </div>
        )}

        {/* Floating Recording indicator */}
        {isRecording && (
          <div
            style={{
              position: 'absolute',
              top: 16,
              left: 16,
              backgroundColor: 'rgba(220, 38, 38, 0.9)',
              color: '#ffffff',
              padding: '6px 12px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              zIndex: 10,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: '#ffffff',
              }}
            />
            REC {formatTime(recordingSeconds)}
          </div>
        )}

        {!streamActive && (
          <button
            style={{
              ...styles.primaryBtn,
              position: 'absolute',
              zIndex: 10,
            }}
            onClick={() => startCamera()}
          >
            Grant Permissions & Start Camera
          </button>
        )}

        {/* Floating Bottom Control Deck */}
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            padding: '8px 16px',
            borderRadius: 999,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            zIndex: 10,
          }}
        >
          {isRecording ? (
            <button
              onClick={stopRecording}
              style={{
                ...styles.primaryBtn,
                backgroundColor: '#dc2626',
                borderRadius: 999,
                padding: '8px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  backgroundColor: '#ffffff',
                }}
              />
              Stop & Save ({formatTime(recordingSeconds)})
            </button>
          ) : (
            <button
              onClick={startRecording}
              disabled={!streamActive}
              style={{
                ...styles.primaryBtn,
                backgroundColor: streamActive ? '#16a34a' : '#475569',
                borderRadius: 999,
                padding: '8px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: streamActive ? 'pointer' : 'not-allowed',
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                }}
              />
              Record Video
            </button>
          )}

          <button
            onClick={toggleAudio}
            style={{
              ...styles.secondaryBtn,
              backgroundColor: audioMuted ? '#ef4444' : '#334155',
              color: '#ffffff',
              border: 'none',
              borderRadius: 999,
              padding: '8px 16px',
            }}
          >
            {audioMuted ? 'Unmute Mic' : 'Mute Mic'}
          </button>

          <button
            onClick={toggleVideo}
            style={{
              ...styles.secondaryBtn,
              backgroundColor: videoDisabled ? '#ef4444' : '#334155',
              color: '#ffffff',
              border: 'none',
              borderRadius: 999,
              padding: '8px 16px',
            }}
          >
            {videoDisabled ? 'Enable Cam' : 'Disable Cam'}
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {cameraError && (
        <div
          style={{
            ...styles.errorBox,
            position: 'absolute',
            bottom: 84,
            left: 20,
            right: 20,
            margin: '0 auto',
            maxWidth: 600,
            zIndex: 20,
          }}
        >
          {cameraError}
        </div>
      )}
    </div>
  );
}