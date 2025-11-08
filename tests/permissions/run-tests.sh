#!/bin/bash

# Permission Testing Suite Runner
# This script runs the comprehensive permission tests for the Emtelaak platform

set -e

echo "=========================================="
echo "Emtelaak Permission Testing Suite"
echo "=========================================="
echo ""

# Check if database is available
echo "Checking database connection..."
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set"
  echo "Please set DATABASE_URL in your .env file"
  exit 1
fi
echo "✅ Database connection configured"
echo ""

# Check if permissions are seeded
echo "Checking if permissions are seeded..."
echo "If this is your first time running tests, please run:"
echo "  pnpm tsx server/seedPermissions.ts"
echo ""

# Run tests
echo "Running permission tests..."
echo ""

# Run all permission tests
pnpm vitest run tests/permissions/ --reporter=verbose

# Check exit code
if [ $? -eq 0 ]; then
  echo ""
  echo "=========================================="
  echo "✅ All permission tests passed!"
  echo "=========================================="
  echo ""
  echo "Next steps:"
  echo "1. Review test results above"
  echo "2. Perform manual UI testing (see README.md)"
  echo "3. Test API endpoints with different permission combinations"
  echo "4. Verify audit logging for permission changes"
  echo ""
else
  echo ""
  echo "=========================================="
  echo "❌ Some tests failed"
  echo "=========================================="
  echo ""
  echo "Troubleshooting:"
  echo "1. Check that permissions are seeded: pnpm tsx server/seedPermissions.ts"
  echo "2. Verify database connection in .env file"
  echo "3. Review test output above for specific failures"
  echo "4. See tests/permissions/README.md for more help"
  echo ""
  exit 1
fi
