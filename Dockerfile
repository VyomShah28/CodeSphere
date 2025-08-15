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

COPY . /app/

ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
ENV PYTHONPATH="/app:${PYTHONPATH}"

CMD ["sh", "-c", "cd $PROJECT_DIR && python manage.py makemigrations && python manage.py migrate && gunicorn --workers 2 ${PROJECT_DIR}.wsgi:application --bind 0.0.0.0:8000"]

