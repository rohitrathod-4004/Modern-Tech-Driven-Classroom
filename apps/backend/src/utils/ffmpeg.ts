import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import path from "path";
import fs from "fs";

if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}
/**
 * Converts any audio file to WAV format (mono, 16kHz) using ffmpeg.
 * Returns the path to the converted WAV file.
 */
export function convertToWav(inputPath: string): Promise<string> {
  const outputPath = `${inputPath}.wav`;

  return new Promise((resolve, reject) => {
    console.log(`[ffmpeg] Converting: ${path.basename(inputPath)} → ${path.basename(outputPath)}`);

    ffmpeg(inputPath)
      .audioChannels(1)        // mono
      .audioFrequency(16000)   // 16kHz — optimal for Whisper
      .toFormat("wav")
      .on("start", (cmd) => {
        console.log(`[ffmpeg] Command: ${cmd}`);
      })
      .on("end", () => {
        console.log(`[ffmpeg] Conversion complete: ${path.basename(outputPath)}`);
        resolve(outputPath);
      })
      .on("error", (err) => {
        console.error(`[ffmpeg] Conversion failed: ${err.message}`);
        reject(new Error(`Audio conversion failed: ${err.message}`));
      })
      .save(outputPath);
  });
}

/**
 * Concatenates ordered WAV chunk files into a single output WebM/OGG file.
 * Uses ffmpeg concat demuxer for gapless joining.
 * @param chunkPaths - Ordered array of WAV file paths
 * @param outputPath - Destination path for the concatenated audio
 */
export function concatenateAudioChunks(chunkPaths: string[], outputPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (chunkPaths.length === 0) {
      reject(new Error('No audio chunks to concatenate'));
      return;
    }

    // Write ffmpeg concat list file
    const listPath = `${outputPath}.list.txt`;
    const listContent = chunkPaths.map(p => `file '${p.replace(/\\/g, '/')}'`).join('\n');
    fs.writeFileSync(listPath, listContent, 'utf8');

    console.log(`[ffmpeg] Concatenating ${chunkPaths.length} chunks → ${path.basename(outputPath)}`);

    ffmpeg()
      .input(listPath)
      .inputOptions(['-f', 'concat', '-safe', '0'])
      .audioChannels(1)
      .audioFrequency(16000)
      .audioCodec('libopus')
      .toFormat('webm')
      .on('end', () => {
        fs.unlinkSync(listPath); // clean up list file
        console.log(`[ffmpeg] Concatenation complete: ${path.basename(outputPath)}`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        try { fs.unlinkSync(listPath); } catch {}
        console.error(`[ffmpeg] Concatenation failed: ${err.message}`);
        reject(new Error(`Audio concatenation failed: ${err.message}`));
      })
      .save(outputPath);
  });
}
