FROM python:3.11-slim

ENV DEBIAN_FRONTEND=noninteractive \
    PIP_INDEX_URL=http://mirrors.aliyun.com/pypi/simple/ \
    PIP_TRUSTED_HOST=mirrors.aliyun.com \
    PIP_DEFAULT_TIMEOUT=120 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        ca-certificates \
        build-essential \
        gcc \
        curl && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.docker.txt requirements.txt
RUN python -m pip install --no-cache-dir -r requirements.txt

COPY server.py .

EXPOSE 8000

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
