import boto3
from botocore.client import Config
from app.core.config import settings
from typing import Optional

def get_s3_client():
    return boto3.client(
        "s3",
        endpoint_url=f"http{'s' if settings.MINIO_SECURE else ''}://{settings.MINIO_ENDPOINT}",
        aws_access_key_id=settings.MINIO_ACCESS_KEY,
        aws_secret_access_key=settings.MINIO_SECRET_KEY,
        config=Config(signature_version="s3v4")
    )

def generate_presigned_url(object_name: str, expiration=3600) -> Optional[str]:
    """Generate a presigned URL to share an S3 object"""
    s3_client = get_s3_client()
    try:
        response = s3_client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': settings.MINIO_BUCKET_NAME,
                'Key': object_name
            },
            ExpiresIn=expiration
        )
    except Exception:
        return None
    return response

def upload_file_to_s3(file_path: str, object_name: str) -> bool:
    """Upload a file to an S3 bucket"""
    s3_client = get_s3_client()
    try:
        s3_client.upload_file(file_path, settings.MINIO_BUCKET_NAME, object_name)
    except Exception:
        return False
    return True
