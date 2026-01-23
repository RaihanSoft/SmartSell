#!/bin/bash
# Safe Prisma generate script for OneDrive-synced directories on Windows
# This script attempts to generate Prisma client but continues even if it fails
# due to OneDrive file locking

echo "Attempting to generate Prisma client..."

if npx prisma generate 2>/dev/null; then
    echo "✓ Prisma client generated successfully"
    exit 0
else
    echo "⚠ Warning: Prisma generate skipped (file may be locked by OneDrive)"
    echo "  If Prisma client already exists, the dev server will still start."
    echo "  For a permanent fix, consider moving your project outside of OneDrive."
    exit 0
fi
