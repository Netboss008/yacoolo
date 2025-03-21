import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Stream {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  viewerCount: number;
  category: string;
  tags: string[];
  streamer: {
    id: string;
    username: string;
    avatar: string;
  };
}

export default function StreamList() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStreams = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/streams');
        if (!response.ok) {
          throw new Error('Fehler beim Laden der Streams');
        }
        const data = await response.json();
        setStreams(data);
      } catch (error) {
        console.error('Fehler:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStreams();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary-500"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {streams.map((stream) => (
        <Link
          key={stream.id}
          href={`/stream/${stream.id}`}
          className="block bg-primary-800 rounded-lg overflow-hidden hover:transform hover:scale-105 transition-transform"
        >
          <div className="relative aspect-video">
            {stream.thumbnail ? (
              <Image
                src={stream.thumbnail}
                alt={stream.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-primary-700 flex items-center justify-center">
                <span className="text-primary-400">Kein Thumbnail</span>
              </div>
            )}
            <div className="absolute bottom-2 left-2 bg-primary-900/80 text-white px-2 py-1 rounded-full text-sm">
              {stream.viewerCount} Zuschauer
            </div>
          </div>
          <div className="p-4">
            <h3 className="text-lg font-semibold text-white mb-2">{stream.title}</h3>
            <p className="text-primary-300 text-sm mb-3 line-clamp-2">{stream.description}</p>
            <div className="flex items-center space-x-2">
              <div className="relative w-8 h-8">
                <Image
                  src={stream.streamer.avatar || '/default-avatar.png'}
                  alt={stream.streamer.username}
                  fill
                  className="rounded-full object-cover"
                />
              </div>
              <span className="text-sm text-secondary-400">{stream.streamer.username}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {stream.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-secondary-500/20 text-secondary-400 text-xs px-2 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
} 