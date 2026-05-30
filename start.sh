#!/bin/bash
BUILD_ID_FILE="./.next/BUILD_ID"
if [ ! -f "$BUILD_ID_FILE" ]; then
  echo "next-build-id-fallback" > "$BUILD_ID_FILE"
fi
./node_modules/.bin/next start -p 3001