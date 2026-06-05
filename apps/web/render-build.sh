#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

echo "Starting Render Build Process..."

# 1. Install dependencies
npm install

# 2. Restore the Next.js build cache from Render's persistent storage
if [[ -d $XDG_CACHE_HOME/next-cache ]]; then
  echo "Restoring Next.js build cache..."
  mkdir -p .next
  cp -R $XDG_CACHE_HOME/next-cache .next/cache
else
  echo "No existing cache found. Next.js will generate a new one."
fi

# 3. Build the Next.js project
npm run build

# 4. Save the new Next.js build cache to Render's persistent storage
echo "Saving Next.js build cache for the next deployment..."
mkdir -p $XDG_CACHE_HOME/next-cache
cp -R .next/cache/* $XDG_CACHE_HOME/next-cache/ || true

echo "Build Completed Successfully!"
