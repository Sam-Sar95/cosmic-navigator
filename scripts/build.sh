#!/bin/bash
set -e

echo "Building server..."
esbuild server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "Copying static files to dist..."
cp index.html dist/
cp manifest.json dist/
cp -r public dist/
cp -r assets dist/

echo "Build complete!"
