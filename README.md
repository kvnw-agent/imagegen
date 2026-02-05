# imagegen

Minimal CLI image generator powered by [OpenRouter](https://openrouter.ai). One command, any model.

## Setup

```bash
npm install
```

Create `~/.config/openrouter/.env`:
```
OPENROUTER_API_KEY=your_key_here
```

Lock it down:
```bash
chmod 600 ~/.config/openrouter/.env
```

## Usage

```bash
node generate.mjs "a cyberpunk cityscape at sunset"
```

### Options

| Flag | Default | Description |
|------|---------|-------------|
| `--model` | `google/gemini-2.5-flash-image` | Any OpenRouter image model |
| `--output` | `output.png` | Output file path |
| `--size` | `1024x1024` | Image dimensions |

### Examples

```bash
# Default model (Gemini Flash)
node generate.mjs "a cat wearing a space helmet" --output cat.png

# Use DALL-E 3
node generate.mjs "minimalist logo" --model openai/dall-e-3

# Custom size
node generate.mjs "landscape painting" --size 1792x1024
```

## Supported Models

Any image generation model on OpenRouter, including:
- `google/gemini-2.5-flash-image` (default)
- `openai/dall-e-3`
- `stabilityai/stable-diffusion-3`
- And more at [openrouter.ai/models](https://openrouter.ai/models)

## License

MIT
