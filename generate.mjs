#!/usr/bin/env node
/**
 * imagegen - Generate images via OpenRouter
 * Usage: node generate.mjs "prompt" [--model MODEL] [--output FILE] [--size SIZE]
 *
 * API key loaded from ~/.config/openrouter/.env (chmod 600)
 * Key is never logged, echoed, or exposed in output.
 */

import OpenAI from "openai";
import { writeFileSync } from "fs";
import { resolve } from "path";
import { config } from "dotenv";
import { homedir } from "os";

// Load key from secured .env file
config({ path: resolve(homedir(), ".config/openrouter/.env") });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
if (!OPENROUTER_API_KEY) {
  console.error("Error: OPENROUTER_API_KEY not set in ~/.config/openrouter/.env");
  process.exit(1);
}

// Parse args
const args = process.argv.slice(2);
let prompt = "";
let model = "google/gemini-2.5-flash-image";
let output = "output.png";
let size = "1024x1024";

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--model" && args[i + 1]) { model = args[++i]; continue; }
  if (args[i] === "--output" && args[i + 1]) { output = args[++i]; continue; }
  if (args[i] === "--size" && args[i + 1]) { size = args[++i]; continue; }
  if (args[i] === "--help") {
    console.log(`Usage: node generate.mjs "prompt" [options]
Options:
  --model MODEL   OpenRouter model (default: openai/dall-e-3)
  --output FILE   Output file path (default: output.png)
  --size SIZE     Image size (default: 1024x1024)

Env: OPENROUTER_API_KEY=your_key`);
    process.exit(0);
  }
  if (!prompt) prompt = args[i];
}

if (!prompt) {
  console.error("Error: provide a prompt as first argument");
  process.exit(1);
}

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: OPENROUTER_API_KEY,
});

console.log(`Generating image...`);
console.log(`  Model: ${model}`);
console.log(`  Size: ${size}`);
console.log(`  Prompt: ${prompt}`);

try {
  const response = await client.images.generate({
    model,
    prompt,
    n: 1,
    size,
    response_format: "b64_json",
  });

  const imageData = response.data[0].b64_json;
  const buffer = Buffer.from(imageData, "base64");
  const outPath = resolve(output);
  writeFileSync(outPath, buffer);
  console.log(`\n✅ Saved to ${outPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
} catch (err) {
  // Some models return URL instead of b64
  if (err.message?.includes("b64_json")) {
    console.log("Retrying with url format...");
    try {
      const response = await client.images.generate({
        model,
        prompt,
        n: 1,
        size,
      });
      const url = response.data[0].url;
      if (url) {
        const res = await fetch(url);
        const buffer = Buffer.from(await res.arrayBuffer());
        const outPath = resolve(output);
        writeFileSync(outPath, buffer);
        console.log(`\n✅ Saved to ${outPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
      }
    } catch (err2) {
      console.error("Error:", err2.message || err2);
      process.exit(1);
    }
  } else {
    console.error("Error:", err.message || err);
    process.exit(1);
  }
}
