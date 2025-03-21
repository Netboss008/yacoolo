import NodeMediaServer from 'node-media-server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const config = {
  rtmp: {
    port: 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60
  },
  http: {
    port: 8000,
    allow_origin: '*'
  },
  trans: {
    ffmpeg: '/usr/local/bin/ffmpeg',
    tasks: [
      {
        app: 'live',
        hls: true,
        hlsFlags: '[hls_time=2:hls_list_size=3:hls_flags=delete_segments]'
      }
    ]
  }
};

const nms = new NodeMediaServer(config);

export function setupStreamingServer() {
  nms.on('prePublish', async (id, StreamPath, args) => {
    const streamKey = StreamPath.split('/')[2];
    const stream = await prisma.stream.findFirst({
      where: { streamKey }
    });

    if (!stream || !stream.isLive) {
      let session = nms.getSession(id);
      session.reject();
    }
  });

  nms.on('postPublish', async (id, StreamPath, args) => {
    const streamKey = StreamPath.split('/')[2];
    await prisma.stream.update({
      where: { streamKey },
      data: { isLive: true }
    });
  });

  nms.on('donePublish', async (id, StreamPath, args) => {
    const streamKey = StreamPath.split('/')[2];
    await prisma.stream.update({
      where: { streamKey },
      data: { isLive: false }
    });
  });

  nms.on('preConnect', async (id, args) => {
    const streamKey = args.streamKey;
    const stream = await prisma.stream.findFirst({
      where: { streamKey },
      include: { guests: true }
    });

    if (stream && stream.guests.length >= 8) {
      let session = nms.getSession(id);
      session.reject();
    }
  });

  nms.run();
  console.log('Streaming server started');
} 