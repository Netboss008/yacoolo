import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { io } from 'socket.io-client';

interface StreamPlayerProps {
  streamKey: string;
  isHost?: boolean;
}

export default function StreamPlayer({ streamKey, isHost = false }: StreamPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const { id } = useParams();
  const socket = useRef<any>(null);

  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;
      
      if (isHost) {
        // Host-Streaming-Logik
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          .then(stream => {
            video.srcObject = stream;
          })
          .catch(err => console.error('Fehler beim Zugriff auf die Kamera:', err));
      } else {
        // Viewer-Streaming-Logik
        const player = new Hls();
        player.loadSource(`http://localhost:8000/live/${streamKey}.m3u8`);
        player.attachMedia(video);
      }
    }

    // Socket.IO Verbindung
    socket.current = io('http://localhost:3001');
    socket.current.emit('joinStream', id);
    socket.current.on('viewerCount', (count: number) => setViewerCount(count));

    return () => {
      if (socket.current) {
        socket.current.emit('leaveStream', id);
        socket.current.disconnect();
      }
    };
  }, [id, streamKey, isHost]);

  return (
    <div className="relative w-full aspect-video bg-primary-900 rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay
        playsInline
        muted={isHost}
      />
      <div className="absolute bottom-4 left-4 bg-primary-800/80 text-white px-3 py-1 rounded-full">
        {viewerCount} Zuschauer
      </div>
    </div>
  );
} 