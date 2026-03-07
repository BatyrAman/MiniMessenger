from pydantic import BaseModel, EmailStr, Field

class RegisterIn(BaseModel):
    username: str = Field(min_length=3, max_length=30)
    email: EmailStr
    password: str = Field(min_length=6, max_length=72)
    first_name: str | None = Field(default=None, max_length=50)
    surname: str | None = Field(default=None, max_length=50)
    # print("REGISTER password length:", len(data.password), "bytes:", len(data.password.encode("utf-8")))
class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=72)

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"