FROM python:3.11-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 ML_HOST=0.0.0.0 ML_PORT=8080
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY features.py modelclass.py predict.py serve.py train.py ./
COPY model/ ./model/
RUN useradd --create-home --uid 10001 shocktwin && chown -R shocktwin:shocktwin /app
USER 10001
EXPOSE 8080
CMD ["python", "serve.py"]
