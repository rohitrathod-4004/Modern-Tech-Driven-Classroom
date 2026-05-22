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

export function mergeChunksToMp3(chunkPaths: string[], outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tempFileListPath = path.join(dir, `temp-list-${Date.now()}.txt`);
    const fileContent = chunkPaths.map(p => `file '${p.replace(/\\/g, '/')}'`).join('\n');
    fs.writeFileSync(tempFileListPath, fileContent);

    ffmpeg()
      .input(tempFileListPath)
      .inputOptions(['-f concat', '-safe 0'])
      .outputFormat('mp3')
      .on('start', (cmd) => {
        console.log(`[ffmpeg] Concat command: ${cmd}`);
      })
      .on('end', () => {
        console.log(`[ffmpeg] Concat complete: ${outputPath}`);
        try {
          if (fs.existsSync(tempFileListPath)) {
            fs.unlinkSync(tempFileListPath);
          }
        } catch (err) {
          console.error("[ffmpeg] Failed to clean up temp list file:", err);
        }
        resolve();
      })
      .on('error', (err) => {
        console.error(`[ffmpeg] Concat failed: ${err.message}`);
        try {
          if (fs.existsSync(tempFileListPath)) {
            fs.unlinkSync(tempFileListPath);
          }
        } catch (cleanupErr) {
          console.error("[ffmpeg] Failed to clean up temp list file on error:", cleanupErr);
        }
        reject(err);
      })
      .save(outputPath);
  });
}
