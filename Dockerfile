FROM python:3.9-slim

RUN apt-get update && apt-get install -y openjdk-17-jdk && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY ./requirements.txt /app/requirements.txt

RUN pip install -r requirements.txt

COPY . /app/

ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64

CMD python manage.py makemigrations && python manage.py migrate && python manage.py runserver
