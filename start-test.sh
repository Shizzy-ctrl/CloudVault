#!/bin/bash

# Start the testing environment without Jaeger
docker-compose -f docker-compose.test.yml up -d --build

echo "Test environment started without Jaeger"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:8000"
echo "Database: localhost:5432"
echo ""
echo "To stop: docker-compose -f docker-compose.test.yml down"
