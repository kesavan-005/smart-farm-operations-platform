@echo off
echo ===================================================
echo Starting AgriOS Development Ecosystem...
echo ===================================================

echo [1/3] Launching Docker Containers (PostgreSQL, Redis, MinIO)...
docker compose up -d

echo [2/3] Loading Environment Variables...
if exist .env (
    for /f "usebackq eol=# tokens=1,* delims==" %%A in (".env") do set "%%A=%%B"
    echo Loaded .env file successfully.
) else (
    echo No .env file found. Proceeding with defaults.
)

echo [3/3] Booting Spring Boot Backend in a new window...
start "AgriOS Backend Server" cmd /k "set JAVA_HOME=C:\Program Files\Java\jdk-17&& cd backend && echo Profile: %SPRING_PROFILES_ACTIVE% && .\apache-maven-3.9.6\bin\mvn.cmd spring-boot:run -Dspring-boot.run.jvmArguments=""-Djava.net.preferIPv6Addresses=true"" -Dspring-boot.run.profiles=%SPRING_PROFILES_ACTIVE%"

echo [4/4] Booting React 19 Frontend in a new window...
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
