from app.core.database import Base
from app.models.user import User
from app.models.camera import Camera
from app.models.setting import Setting
from app.models.recording import Recording

# Import all models here so that Alembic or Base.metadata.create_all
# can discover them correctly.
