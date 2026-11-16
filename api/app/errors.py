class ApiError(Exception):
    status_code = 500
    message = "Server error."


class NotFound(ApiError):
    status_code = 404
    message = "Not found."


class Unauthenticated(ApiError):
    status_code = 401
    message = "Unauthenticated."


class TooManyAttempts(ApiError):
    status_code = 429
    message = "Too many attempts."
