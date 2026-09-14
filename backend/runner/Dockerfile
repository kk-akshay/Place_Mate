FROM python:3.13-slim

WORKDIR /runner

COPY runner.py /runner/runner.py

RUN chmod 0555 /runner/runner.py

USER 65534:65534

ENTRYPOINT ["python", "-I", "-B", "/runner/runner.py"]