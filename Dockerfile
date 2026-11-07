FROM python:3.12-slim

WORKDIR /app

# Инсталиране на зависимостите
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копиране на сорс кода
COPY . .

# Порт на Flask бекенда
EXPOSE 5001

CMD ["python", "app.py"]

