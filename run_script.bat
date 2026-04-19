@echo off
echo =======================================================
echo Starting Kyrylo Bachelor Thesis Application...
echo =======================================================

echo 1/5 Starting Core Service...
start "Core Service (8081)" cmd /k "cd backend && .\mvnw.cmd -pl core-service spring-boot:run"

echo 2/5 Starting User Service...
start "User Service (8082)" cmd /k "cd backend && .\mvnw.cmd -pl user-service spring-boot:run"

echo 3/5 Starting Course Service...
start "Course Service (8083)" cmd /k "cd backend && .\mvnw.cmd -pl course-service spring-boot:run"

:: Робимо паузу на 10 секунд, щоб сервіси встигли трохи піднятися перед запуском Gateway
echo Waiting 10 seconds for services to initialize...
timeout /t 10 /nobreak

echo 4/5 Starting API Gateway...
start "API Gateway (8080)" cmd /k "cd backend && .\mvnw.cmd -pl api-gateway spring-boot:run"

echo 5/5 Starting React Frontend...
start "React Frontend (5173)" cmd /k "cd frontend && npm run dev"

echo =======================================================
echo All services are launching in separate windows!
echo.
echo *** PRESS ANY KEY IN THIS WINDOW TO STOP ALL SERVICES ***
echo =======================================================
:: Чекаємо натискання будь-якої клавіші (Enter, Пробіл тощо)
pause > nul

echo.
echo Stopping all services, please wait...

:: Шукаємо вікна за їхніми заголовками і закриваємо їх разом із дочірніми процесами (Java/Node)
taskkill /F /T /FI "WINDOWTITLE eq Core Service (8081)*" >nul 2>&1
taskkill /F /T /FI "WINDOWTITLE eq User Service (8082)*" >nul 2>&1
taskkill /F /T /FI "WINDOWTITLE eq Course Service (8083)*" >nul 2>&1
taskkill /F /T /FI "WINDOWTITLE eq API Gateway (8080)*" >nul 2>&1
taskkill /F /T /FI "WINDOWTITLE eq React Frontend (5173)*" >nul 2>&1

:: Опційне підстрахування: якщо раптом Java зависне, розкоментуй рядок нижче, щоб вбити всі процеси Java
:: taskkill /F /IM java.exe >nul 2>&1

echo All windows closed and services stopped!
:: Чекаємо 2 секунди, щоб ти встиг прочитати повідомлення, перш ніж головне вікно закриється
timeout /t 2 > nul