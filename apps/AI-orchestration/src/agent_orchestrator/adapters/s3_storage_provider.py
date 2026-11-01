from __future__ import annotations

import os
from typing import Any

import boto3
from botocore.config import Config

from agent_orchestrator.domain.protocols import StorageService


class S3StorageProvider(StorageService):
    """
    AWS S3 implementation of StorageService protocol.
    Can be seamlessly swapped with any other provider (R2, MinIO, GCS)
    without affecting business logic or use cases.
    """

    def __init__(
        self,
        bucket_name: str | None = None,
        region_name: str | None = None,
    ):
        raw_bucket = (
            bucket_name or os.environ.get("AWS_S3_BUCKET") or "my-client-pdf-uploads-mumbai"
        )
        self.bucket_name = raw_bucket.strip()
        self.region = (region_name or os.environ.get("AWS_REGION") or "ap-south-1").strip()

        client_kwargs: dict[str, Any] = {
            "service_name": "s3",
            "region_name": self.region,
            "endpoint_url": f"https://s3.{self.region}.amazonaws.com",
            "config": Config(
                signature_version="s3v4",
                s3={"addressing_style": "virtual"},
            ),
        }
        aws_access_key = os.environ.get("AWS_ACCESS_KEY_ID")
        aws_secret_key = os.environ.get("AWS_SECRET_ACCESS_KEY")
        if aws_access_key and aws_secret_key:
            client_kwargs["aws_access_key_id"] = aws_access_key.strip()
            client_kwargs["aws_secret_access_key"] = aws_secret_key.strip()

        self._s3_client = boto3.client(**client_kwargs)

    def generate_presigned_upload_url(
        self,
        key: str,
        content_type: str = "application/pdf",
        expires_in: int = 900,
    ) -> str:
        url: str = self._s3_client.generate_presigned_url(
            ClientMethod="put_object",
            Params={
                "Bucket": self.bucket_name,
                "Key": key,
                "ContentType": content_type,
            },
            ExpiresIn=expires_in,
        )
        return url

    def delete_object(self, key: str, bucket: str | None = None) -> None:
        target_bucket = bucket or self.bucket_name
        self._s3_client.delete_object(Bucket=target_bucket, Key=key)

    def get_bucket_name(self) -> str:
        return self.bucket_name
