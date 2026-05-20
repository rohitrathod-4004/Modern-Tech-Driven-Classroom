import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import path from "path";

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
