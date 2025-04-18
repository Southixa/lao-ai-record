"use client"

import { useChunkedAudioRecorder } from '@/hooks/useChunkedAudioRecorder';
import Link from 'next/link';
import React, { useCallback, useRef, useState } from 'react'

type Status = 'idle' | 'recording' | 'paused' | 'stopped' | 'error';

const MediaRecorderPage = () => {

    const [blobUrl, setBlobUrl] = useState<Array<string>>([]);

    const { status, recordingTime, start, stop, pause, resume } = useChunkedAudioRecorder({
        onChunk: async (blob, chunkIndex) => {
            console.log(blob, chunkIndex);
            const url = URL.createObjectURL(blob);
            setBlobUrl((prev) => [...(prev || []), url]);
        },
        timesliceSeconds: 5,
    });

  return (
    <div>
        {status === 'idle' && (
            <button onClick={() => {start()}} className='px-2 py-2 bg-red-500 rounded-full text-white'>recrod</button>
        )}
        {status === 'recording' && (
            <button onClick={() => {pause()}} className='px-2 py-2 bg-red-500 rounded-full text-white'>pause</button>
        )}
        {status === 'paused' && (
            <button onClick={() => {resume()}} className='px-2 py-2 bg-red-500 rounded-full text-white'>resume</button>
        )}
        {(status === 'recording' || status === 'paused') && (
            <button onClick={() => {stop()}} className='px-2 py-2 bg-red-500 rounded-full text-white'>stop</button>
        )}
        <p>{recordingTime}</p>
        <p>status:{status}</p>
        {status === 'stopped' && blobUrl.length > 0 && (
            <div>
                {blobUrl.map((url, index) => (
                    <audio key={index} controls src={url} />
                ))}
            </div>
        )}
        <Link href="/">home</Link>
    </div>
  )
}

export default MediaRecorderPage