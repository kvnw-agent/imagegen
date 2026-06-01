# Imagegen Usage Guide

## Overview
Image generation tool using OpenRouter API.

## Default Model
`google/gemini-2.5-flash-image` - Works well, fast, cost-effective

## Basic Usage
```bash
cd ~/emberlite/tools/imagegen
node generate.mjs "your prompt here" --output /path/to/output.png
```

## Options
- `--model MODEL` - Change the model (default: gemini-2.5-flash-image)
- `--output FILE` - Output path (default: output.png)
- `--size SIZE` - Size for DALL-E models (default: 1024x1024)

## Tested Models

| Model | Status | Notes |
|-------|--------|-------|
| google/gemini-2.5-flash-image | ✅ Works | Default, fast, good quality |
| openai/dall-e-3 | ❌ Not available | OpenRouter doesn't expose this |

## API Key
Stored at `~/.config/openrouter/.env`:
```
OPENROUTER_API_KEY=sk-or-...
```

## Examples

```bash
# Simple test
node generate.mjs "A red circle on white background" --output test.png

# Interior design
node generate.mjs "Modern living room with black Togo sofa, gallery wall, leopard rug" --output room.png
```

## Cost
Gemini Flash is very cheap - typically fractions of a cent per image.

## Last tested
2026-02-12 - Working correctly
