FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY flaskr /app/flaskr

ENV FLASK_APP=flaskr

CMD ["gunicorn", "-w", "1", "-k", "eventlet", "-b", "0.0.0.0:8000", "flaskr:create_app()"]