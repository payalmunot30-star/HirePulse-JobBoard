"""Validators for file uploads and account data."""
import os
from rest_framework import serializers


def validate_pdf_resume(file):
    """
    Validate that an uploaded resume is:
    1. Not exceeding 5MB
    2. File extension is strictly .pdf
    3. MIME content-type is application/pdf
    4. Binary signature starts with %PDF
    """
    if not file:
        return file

    # 1. Size check (Max 5MB)
    max_size = 5 * 1024 * 1024
    if hasattr(file, 'size') and file.size > max_size:
        raise serializers.ValidationError(
            "Resume file size cannot exceed 5MB."
        )

    # 2. Extension check (.pdf only)
    name = getattr(file, 'name', '')
    if not name:
        raise serializers.ValidationError("Invalid file: missing file name.")

    ext = os.path.splitext(name)[1].lower()
    if ext != '.pdf':
        raise serializers.ValidationError(
            "Only PDF files are allowed. Please upload a file with a .pdf extension."
        )

    # 3. MIME type check (application/pdf)
    content_type = getattr(file, 'content_type', None)
    if content_type and content_type.lower() != 'application/pdf':
        raise serializers.ValidationError(
            f"Invalid file type '{content_type}'. Resume must have MIME type 'application/pdf'."
        )

    # 4. Binary signature (magic bytes) check: must start with %PDF
    try:
        pos = file.tell() if hasattr(file, 'tell') else 0
        header = file.read(4)
        if hasattr(file, 'seek'):
            file.seek(pos)
        if header and len(header) >= 4 and not header.startswith(b'%PDF'):
            raise serializers.ValidationError(
                "Invalid PDF document. The file content does not match a valid PDF header."
            )
    except serializers.ValidationError:
        raise
    except Exception:
        pass

    return file
