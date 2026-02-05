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
  --model MODEL   OpenRouter model (default: google/gemini-2.5-flash-image)
  --output FILE   Output file path (default: output.png)
  --size SIZE     Image size for DALL-E models (default: 1024x1024)

Env: ~/.config/openrouter/.env (OPENROUTER_API_KEY)`);
    process.exit(0);
  }
  if (!prompt) prompt = args[i];
}

if (!prompt) {
  console.error("Error: provide a prompt as first argument");
  process.exit(1);
}

console.log(`Generating image...`);
console.log(`  Model: ${model}`);
console.log(`  Prompt: ${prompt}`);

const isDalle = model.includes("dall-e");

try {
  if (isDalle) {
    // DALL-E uses the images API
    const client = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: OPENROUTER_API_KEY,
    });
    const response = await client.images.generate({
      model, prompt, n: 1, size,
      response_format: "b64_json",
    });
    const buffer = Buffer.from(response.data[0].b64_json, "base64");
    const outPath = resolve(output);
    writeFileSync(outPath, buffer);
    console.log(`\n✅ Saved to ${outPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
  } else {
    // Chat-based image generation (Gemini, etc.)
    // Images come back in message.images[] as {type: "image_url", image_url: {url: "data:..."}}
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("API Error:", JSON.stringify(data, null, 2));
      process.exit(1);
    }

    const message = data.choices?.[0]?.message;
    if (!message) {
      console.error("No message in response");
      process.exit(1);
    }

    // Check message.images[] (OpenRouter's format for Gemini image output)
    const images = message.images;
    if (Array.isArray(images) && images.length > 0) {
      const img = images[0];
      let buffer;

      if (typeof img === "string") {
        const b64 = img.startsWith("data:") ? img.split(",")[1] : img;
        buffer = Buffer.from(b64, "base64");
      } else if (img?.image_url?.url) {
        const url = img.image_url.url;
        if (url.startsWith("data:")) {
          buffer = Buffer.from(url.split(",")[1], "base64");
        } else {
          const res = await fetch(url);
          buffer = Buffer.from(await res.arrayBuffer());
        }
      }

      if (buffer) {
        const outPath = resolve(output);
        writeFileSync(outPath, buffer);
        console.log(`\n✅ Saved to ${outPath} (${(buffer.length / 1024).toFixed(1)} KB)`);

        // Print any text content too
        if (message.content) {
          console.log(`  Caption: ${typeof message.content === "string" ? message.content.trim() : ""}`);
        }
      } else {
        console.error("Could not decode image from response");
        process.exit(1);
      }
    } else {
      // Fallback: check content array
      let saved = false;
      if (Array.isArray(message.content)) {
        for (const part of message.content) {
          if (part.type === "image_url" && part.image_url?.url) {
            const url = part.image_url.url;
            const b64 = url.startsWith("data:") ? url.split(",")[1] : null;
            const buffer = b64
              ? Buffer.from(b64, "base64")
              : Buffer.from(await (await fetch(url)).arrayBuffer());
            writeFileSync(resolve(output), buffer);
            console.log(`\n✅ Saved to ${resolve(output)} (${(buffer.length / 1024).toFixed(1)} KB)`);
            saved = true;
            break;
          }
        }
      }
      if (!saved) {
        console.error("No image found in response.");
        console.error("Text:", typeof message.content === "string" ? message.content.slice(0, 300) : JSON.stringify(message.content)?.slice(0, 300));
        process.exit(1);
      }
    }
  }
} catch (err) {
  console.error("Error:", err.message || err);
  process.exit(1);
}
