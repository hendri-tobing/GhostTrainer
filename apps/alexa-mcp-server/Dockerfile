FROM python:3.12-slim

WORKDIR /app

# Copy shared packages
COPY packages/bedrock-coach /app/packages/bedrock-coach
RUN pip install --no-cache-dir /app/packages/bedrock-coach

# Copy alexa server
COPY apps/alexa-mcp-server/requirements.txt /app/
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY apps/alexa-mcp-server /app/apps/alexa-mcp-server

WORKDIR /app/apps/alexa-mcp-server

EXPOSE 8002

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002"]
