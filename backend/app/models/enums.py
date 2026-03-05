# app/models/enums.py
from enum import Enum

class MediaType(str, Enum):
    image = "image"
    video = "video"