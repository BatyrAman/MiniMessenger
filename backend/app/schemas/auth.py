from pydantic import BaseModel, EmailStr, Field, model_validator


class RegisterRequest(BaseModel):
    first_name: str
    surname: str
    username: str
    email: EmailStr
    password: str
    password_confirm: str

    @model_validator(mode="after")
    def validate_passwords(self):
        if self.password != self.password_confirm:
            raise ValueError("Passwords do not match")
        return self
class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=72)

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"