#!/bin/bash

# Script to switch to direct config when environment variable issues occur

echo "Backing up current config.ts..."
mv src/config.ts src/config.env.ts.bak

echo "Switching to direct config..."
cp src/config.direct.ts src/config.ts

echo "Done! Using direct config with hardcoded URLs."
echo "To switch back, run: mv src/config.env.ts.bak src/config.ts"