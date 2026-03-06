FROM python:3.11-slim

WORKDIR /app

RUN pip install --no-cache-dir pandas openpyxl sqlalchemy pymysql cryptography

COPY *.py ./

CMD ["python", "load_telco.py"]