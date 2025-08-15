FROM python:3.11-slim-bullseye

RUN apt-get update && apt-get install -y \
    openjdk-17-jdk \
    gcc \
    libpq-dev \
    python3-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY ./requirements.txt /app/requirements.txt

RUN pip install -r requirements.txt

COPY ./Coding /app/Coding
COPY ./Slaves /app/Slaves

ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64

CMD ["sh", "-c", "python $PROJECT_DIR/manage.py makemigrations && python $PROJECT_DIR/manage.py migrate && gunicorn --workers 2 --bind 0.0.0.0:8000 --timeout 600 --log-level=info --pythonpath /app $PROJECT_DIR.wsgi:application"]
