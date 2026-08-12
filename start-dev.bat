@echo off
echo ===================================================
echo Starting AgriOS Development Ecosystem...
echo ===================================================

echo [1/3] Launching Docker Containers (PostgreSQL, Redis, MinIO)...
docker compose up -d

echo [2/3] Booting Spring Boot Backend in a new window...
start "AgriOS Backend Server" cmd /c "set JAVA_HOME=C:\Program Files\Java\jdk-17 && cd backend && .\apache-maven-3.9.6\bin\mvn.cmd spring-boot:run"

echo [3/3] Booting React 19 Frontend in a new window...
start "AgriOS Frontend App" cmd /c "cd frontend && npm run dev"

echo ===================================================
echo Ecosystem Launched!
echo.
echo Frontend App:    http://localhost:5173
echo Backend API:     http://localhost:8080
echo Swagger Docs:    http://localhost:8080/swagger-ui/index.html
echo MinIO Console:   http://localhost:9001
echo ===================================================
pause
