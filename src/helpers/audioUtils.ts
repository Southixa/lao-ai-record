
// Helper functions for audio processing

/**
 * Converts a stereo Audio Blob to a mono WAV Blob using the Web Audio API.
 * @param audioBlob The input Blob (likely in a format like mp3, ogg, wav).
 * @returns A Promise that resolves with a mono WAV Blob.
 */
export async function convertToMono(audioBlob: Blob): Promise<Blob> {
    try {
      // Decode the Blob into an AudioBuffer
      const arrayBuffer = await audioBlob.arrayBuffer();
      // Ensure AudioContext is available (handle browser differences)
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) {
        throw new Error("Web Audio API is not supported in this browser.");
      }
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
      // Check if it's already mono
      if (audioBuffer.numberOfChannels === 1) {
        console.log("Audio is already mono.");
        // Optional: If it's already mono but not WAV, convert it to WAV here
        // For simplicity, returning the original blob if it's already mono
        // To ensure WAV format, uncomment and complete the WAV encoding part below
        // const wavBlob = await encodeAudioBufferToWav(audioBuffer);
        // return wavBlob;
        return audioBlob; // Or convert to WAV if needed
      }
  
      // Create a new mono buffer
      const monoBuffer = audioContext.createBuffer(
        1, // 1 channel (mono)
        audioBuffer.length,
        audioBuffer.sampleRate
      );
  
      // Get channel data
      const left = audioBuffer.getChannelData(0);
      // Handle potential mono source decoded as stereo (or true stereo)
      const right = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : left;
      const monoData = monoBuffer.getChannelData(0);
  
      // Mix down stereo to mono by averaging channels
      for (let i = 0; i < audioBuffer.length; i++) {
        monoData[i] = (left[i] + right[i]) / 2;
      }
  
      // Encode the mono AudioBuffer back to a WAV Blob
      const wavBlob = await encodeAudioBufferToWav(monoBuffer);
      return wavBlob;
  
    } catch (error) {
      console.error("Error converting audio to mono:", error);
      // Return original blob as fallback or throw error
      // throw error; // Re-throw if you want the calling function to handle it
      return audioBlob; // Fallback to original blob
    }
  }
  
  /**
   * Encodes an AudioBuffer to a WAV Blob.
   * @param audioBuffer The AudioBuffer to encode.
   * @returns A Promise that resolves with a WAV Blob.
   */
  async function encodeAudioBufferToWav(audioBuffer: AudioBuffer): Promise<Blob> {
    // Use OfflineAudioContext to render the buffer
    const offlineContext = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineContext.destination);
    source.start(0);
  
    const renderedBuffer = await offlineContext.startRendering();
  
    // Convert the rendered buffer to WAV format
    const wavData = encodeWAV(renderedBuffer.getChannelData(0), renderedBuffer.sampleRate, renderedBuffer.numberOfChannels);
    return new Blob([wavData], { type: 'audio/wav' });
  }
  
  
  // --- WAV Encoding Functions ---
  
  /**
   * Encodes PCM audio data into WAV format.
   * @param samples Float32Array of audio samples.
   * @param sampleRate The sample rate (e.g., 44100).
   * @param numChannels Number of audio channels (1 for mono, 2 for stereo).
   * @returns An ArrayBuffer containing the WAV file data.
   */
  function encodeWAV(samples: Float32Array, sampleRate: number, numChannels: number): ArrayBuffer {
    const bytesPerSample = 2; // 16-bit PCM
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = samples.length * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataSize); // 44 bytes for header
    const view = new DataView(buffer);
  
    // RIFF chunk descriptor
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true); // ChunkSize
    writeString(view, 8, 'WAVE');
  
    // "fmt " sub-chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
    view.setUint16(22, numChannels, true); // NumChannels
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, byteRate, true); // ByteRate
    view.setUint16(32, blockAlign, true); // BlockAlign
    view.setUint16(34, bytesPerSample * 8, true); // BitsPerSample
  
    // "data" sub-chunk
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true); // Subchunk2Size
  
    // Write audio data (convert float samples to 16-bit PCM)
    floatTo16BitPCM(view, 44, samples);
  
    return buffer;
  }
  
  function writeString(view: DataView, offset: number, str: string): void {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }
  
  function floatTo16BitPCM(output: DataView, offset: number, input: Float32Array): void {
    for (let i = 0; i < input.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, input[i]));
      // Convert to 16-bit integer
      output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
  } 