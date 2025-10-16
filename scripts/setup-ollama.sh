#!/bin/bash

echo "🔥 Eburon AI - Ollama Cloud Setup"
echo "=================================="
echo ""

# Sign in to Ollama Cloud
echo "📝 Signing in to Ollama Cloud..."
ollama signin

if [ $? -ne 0 ]; then
    echo "❌ Failed to sign in to Ollama Cloud"
    exit 1
fi

echo ""
echo "✅ Successfully signed in!"
echo ""

# Pull required models
echo "📦 Pulling required models..."
echo ""

models=(
    "deepseek-v3.1:671b-cloud"
    "gpt-oss:20b-cloud"
    "gpt-oss:120b-cloud"
    "kimi-k2:1t-cloud"
    "qwen3-coder:480b-cloud"
)

for model in "${models[@]}"; do
    echo "⬇️  Pulling $model..."
    ollama pull "$model"
    
    if [ $? -eq 0 ]; then
        echo "✅ Successfully pulled $model"
    else
        echo "❌ Failed to pull $model"
    fi
    echo ""
done

echo "=================================="
echo "🎉 Ollama Cloud setup complete!"
echo "All models are ready for Eburon AI"
