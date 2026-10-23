"""FastAPI endpoint for local development and the SAP AI Core serving container."""

from __future__ import annotations

import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from predict import LinkPredictor, MODEL_DIR


class PredictRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    nodes: list[dict[str, Any]] = Field(min_length=1, max_length=10000)
    links: list[dict[str, Any]] = Field(default_factory=list, max_length=100000)
    candidates: list[dict[str, str]] = Field(default_factory=list, max_length=10000)


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.predictor = LinkPredictor(Path(os.environ.get("MODEL_DIR", str(MODEL_DIR))))
    yield


app = FastAPI(title="ShockTwin synthetic GraphSAGE inference", version="0.1.0", lifespan=lifespan)


@app.get("/health")
def health():
    return {"status": "ok", "model": app.state.predictor.version,
            "trainingDomain": "synthetic", "illustrative": True}


@app.get("/metrics")
def metrics():
    return app.state.predictor.metadata()


@app.post("/predict")
def predict(request: PredictRequest):
    try:
        return app.state.predictor.predict(request.nodes, request.links, request.candidates)
    except ValueError as error:
        raise HTTPException(status_code=400, detail={"code": "INVALID_GRAPH", "message": str(error)}) from error


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=os.environ.get("ML_HOST", "127.0.0.1"),
                port=int(os.environ.get("ML_PORT", "8000")), log_level="info")
