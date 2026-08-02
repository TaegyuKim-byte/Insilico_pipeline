from fastapi import Request
from fastapi.responses import JSONResponse


class APIError(Exception):
    """api.md의 공통 에러 포맷 {code, message, details?} 을 위한 예외."""

    def __init__(self, status_code: int, code: str, message: str, details: dict | None = None):
        self.status_code = status_code
        self.code = code
        self.message = message
        self.details = details


async def api_error_handler(request: Request, exc: APIError) -> JSONResponse:
    body = {"code": exc.code, "message": exc.message}
    if exc.details is not None:
        body["details"] = exc.details
    return JSONResponse(status_code=exc.status_code, content=body)
