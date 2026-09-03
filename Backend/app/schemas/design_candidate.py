from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


CandidateStatus = Literal[
    "generated",
    "selected",
    "rejected",
]


# --- New generator output models ---

class GeneratedMember(BaseModel):
    """A single structural member in a generated design."""
    id: str = Field(min_length=1, max_length=50)
    type: str = Field(min_length=1, max_length=50)
    length_m: float = Field(gt=0)
    material_id: str = Field(min_length=1, max_length=100)
    diameter_m: float | None = Field(default=None, gt=0)
    # Accept extra fields from DesignVersion (start, end, dimensions) silently


class GeneratedConnection(BaseModel):
    """A connection between two members."""
    a: str = Field(min_length=1, max_length=50)
    b: str = Field(min_length=1, max_length=50)
    type: str = Field(min_length=1, max_length=50)


class DesignCandidatePayload(BaseModel):
    """
    Accepts output from both old (MockDesignGenerator) and new
    (LocalGenerationService via candidate_to_design_version) generators.
    """
    # New generator fields
    schema_version: str | None = None
    design_type: str | None = None
    version: str | None = None
    span_m: float | None = Field(default=None, gt=0)
    height_m: float | None = Field(default=None, gt=0)
    members: list[GeneratedMember] = Field(default_factory=list)
    connections: list[GeneratedConnection] = Field(default_factory=list)

    # Legacy generator fields (backward compat)
    name: str | None = None
    footprint_m2: float | None = None
    overall_height_m: float | None = None
    components: list[dict] | None = None
    generation_notes: str | None = None

    generation_method: str | None = None
    metadata: dict | None = None

    model_config = ConfigDict(extra="ignore")

    @field_validator("name")
    @classmethod
    def clean_name(cls, value):
        if value is None:
            return value
        value = value.strip()
        if not value:
            raise ValueError("name cannot be empty")
        return value

    @field_validator("members")
    @classmethod
    def validate_has_content(cls, value, info):
        # Must have either members (new) or components (old)
        return value


class DesignCandidateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    site_id: int
    design_specification_id: int
    status: str
    generator_name: str
    generator_version: str | None
    candidate_json: str
    input_snapshot_json: str
    created_at: datetime
