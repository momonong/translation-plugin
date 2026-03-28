from pydantic import BaseModel
from typing import List


class KeywordResponse(BaseModel):
    keywords: List[str]


class Relation(BaseModel):
    source: str
    relation: str
    target: str
    weight: float


class RelatedTermsResponse(BaseModel):
    term: str
    results: List[Relation]


class RelationItem(BaseModel):
    source: str
    target: str
    weight: float


class RelationGroup(BaseModel):
    relation: str
    items: List[RelationItem]


class GroupedRelatedTermsResponse(BaseModel):
    term: str
    groups: List[RelationGroup]


