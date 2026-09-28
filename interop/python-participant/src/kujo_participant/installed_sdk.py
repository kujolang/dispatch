"""Operator/package composition. Never constructed from participant requests."""
from .codec import NS, EXT, GIT
from .sdk import create_codec
sdk = create_codec({'namespace': NS,
    'participant': {'schema': EXT, 'fields': {'call_id': 'identifier', 'process_instance_id': 'identifier'}},
    'effect': {'schema': GIT, 'fields': {'workcell_effect_id': 'identifier', 'transaction_sha256': 'sha256'}}})
