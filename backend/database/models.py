"""
SQLAlchemy ORM models for PRISM.
Implements the 6 schemas and enforces ETL tracking columns across all entities.
"""
import hashlib
import json
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    DateTime,
    Double,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from backend.database.connection import Base


class ETLTrackingMixin:
    """
    Standardized ETL Tracking Mixin applied to every database table.
    Enables CDC (Change Data Capture), incremental ingestion, provenance, and row-level auditing.
    """
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    etl_job_id = Column(String(64), default="ETL_INIT", nullable=False)
    sync_version = Column(BigInteger, default=1, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    row_hash = Column(String(64), nullable=True)
    source_system = Column(String(64), default="prism", nullable=False)

    def calculate_row_hash(self, content_dict: Dict[str, Any]) -> str:
        """Calculates a deterministic SHA-256 row checksum for change detection."""
        clean_dict = {
            k: v for k, v in content_dict.items() 
            if k not in ("created_at", "updated_at", "row_hash", "etl_job_id", "sync_version")
        }
        encoded = json.dumps(clean_dict, sort_keys=True, default=str).encode("utf-8")
        return hashlib.sha256(encoded).hexdigest()


# ========================================================================
# SCHEMA 1: iam
# ========================================================================

class User(Base, ETLTrackingMixin):
    __tablename__ = "users"
    __table_args__ = {"schema": "iam"}

    id = Column(String(64), primary_key=True)
    email = Column(String(255), unique=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(64), default="TRIAGE_ENGINEER", nullable=False)
    department = Column(String(128), default="Platform Engineering")
    avatar_url = Column(Text, nullable=True)
    preferences_json = Column(JSONB, default=dict)
    is_active = Column(Boolean, default=True)


class ProjectMembership(Base, ETLTrackingMixin):
    __tablename__ = "project_memberships"
    __table_args__ = (
        UniqueConstraint("project_id", "user_id", name="uq_user_project"),
        {"schema": "iam"}
    )

    id = Column(String(64), primary_key=True)
    project_id = Column(String(64), nullable=False)
    user_id = Column(String(64), ForeignKey("iam.users.id", ondelete="CASCADE"), nullable=False)
    project_role = Column(String(64), default="MEMBER", nullable=False)
    granted_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)


class SessionRecord(Base, ETLTrackingMixin):
    __tablename__ = "sessions"
    __table_args__ = {"schema": "iam"}

    id = Column(String(64), primary_key=True)
    user_id = Column(String(64), ForeignKey("iam.users.id", ondelete="CASCADE"), nullable=False)
    active_project_id = Column(String(64), nullable=True)
    active_environment = Column(String(64), default="dev")
    delegated_credentials_json = Column(JSONB, default=dict)
    expires_at = Column(DateTime(timezone=True), nullable=False)


# ========================================================================
# SCHEMA 2: control_plane
# ========================================================================

class Project(Base, ETLTrackingMixin):
    __tablename__ = "projects"
    __table_args__ = {"schema": "control_plane"}

    id = Column(String(64), primary_key=True)
    project_key = Column(String(32), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    owner_id = Column(String(64), ForeignKey("iam.users.id"), nullable=True)
    status = Column(String(32), default="ACTIVE", nullable=False)
    is_followed = Column(Boolean, default=False, nullable=False)
    default_environment = Column(String(64), default="dev", nullable=False)
    tags = Column(JSONB, default=list)


class ProjectEnvironment(Base, ETLTrackingMixin):
    __tablename__ = "project_environments"
    __table_args__ = (
        UniqueConstraint("project_id", "environment_name", name="uq_proj_env"),
        {"schema": "control_plane"}
    )

    id = Column(String(64), primary_key=True)
    project_id = Column(String(64), ForeignKey("control_plane.projects.id", ondelete="CASCADE"), nullable=False)
    environment_name = Column(String(64), nullable=False)
    is_default = Column(Boolean, default=False, nullable=False)
    description = Column(Text, nullable=True)
    egress_boundary = Column(String(128), default="INTERNAL_VPC")


class ProjectSetupInstruction(Base, ETLTrackingMixin):
    __tablename__ = "project_setup_instructions"
    __table_args__ = {"schema": "control_plane"}

    id = Column(String(64), primary_key=True)
    project_id = Column(String(64), ForeignKey("control_plane.projects.id", ondelete="CASCADE"), unique=True, nullable=False)
    prompt_directives = Column(Text, nullable=False)
    triage_guidelines = Column(Text, nullable=True)
    domain_context = Column(Text, nullable=True)
    escalation_policy = Column(Text, nullable=True)
    updated_by = Column(String(64), ForeignKey("iam.users.id"), nullable=True)


class ProjectDisplayConfig(Base, ETLTrackingMixin):
    __tablename__ = "project_display_configs"
    __table_args__ = (
        UniqueConstraint("project_id", "connector_id", name="uq_proj_connector_display"),
        {"schema": "control_plane"}
    )

    id = Column(String(64), primary_key=True)
    project_id = Column(String(64), ForeignKey("control_plane.projects.id", ondelete="CASCADE"), nullable=False)
    connector_id = Column(String(64), nullable=False)
    display_mode = Column(String(64), default="CARD", nullable=False)
    priority_fields = Column(JSONB, default=list)
    hidden_fields = Column(JSONB, default=list)
    custom_formatting_rules = Column(JSONB, default=dict)


class ParameterDefinition(Base, ETLTrackingMixin):
    __tablename__ = "parameter_definitions"
    __table_args__ = {"schema": "control_plane"}

    parameter_key = Column(String(128), primary_key=True)
    connector_id = Column(String(64), nullable=True)
    scope_level = Column(String(64), nullable=False)  # PLATFORM_ONLY, PROJECT_OVERRIDABLE, PROJECT_MANDATORY, USER_CUSTOMIZED
    data_type = Column(String(32), nullable=False)
    default_value_json = Column(JSONB, nullable=False)
    validation_rules_json = Column(JSONB, default=dict)
    is_secret = Column(Boolean, default=False, nullable=False)
    ui_section = Column(String(64), default="General", nullable=False)
    display_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)


class ParameterValue(Base, ETLTrackingMixin):
    __tablename__ = "parameter_values"
    __table_args__ = {"schema": "control_plane"}

    id = Column(String(64), primary_key=True)
    parameter_key = Column(String(128), ForeignKey("control_plane.parameter_definitions.parameter_key", ondelete="CASCADE"), nullable=False)
    level = Column(String(32), nullable=False)  # PLATFORM, PROJECT, USER
    project_id = Column(String(64), ForeignKey("control_plane.projects.id", ondelete="CASCADE"), nullable=True)
    user_id = Column(String(64), ForeignKey("iam.users.id", ondelete="CASCADE"), nullable=True)
    configured_value_json = Column(JSONB, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)


# ========================================================================
# SCHEMA 3: integration
# ========================================================================

class ConnectorCatalog(Base, ETLTrackingMixin):
    __tablename__ = "connector_catalog"
    __table_args__ = {"schema": "integration"}

    id = Column(String(64), primary_key=True)
    connector_key = Column(String(64), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(64), nullable=False)
    icon_name = Column(String(64), nullable=False)
    supported_protocols = Column(JSONB, nullable=False)
    capabilities = Column(JSONB, nullable=False)
    is_admin_enabled = Column(Boolean, default=False, nullable=False)
    documentation_url = Column(Text, nullable=True)


class ConnectorInstance(Base, ETLTrackingMixin):
    __tablename__ = "connector_instances"
    __table_args__ = {"schema": "integration"}

    id = Column(String(64), primary_key=True)
    instance_key = Column(String(64), unique=True, nullable=False)
    connector_key = Column(String(64), ForeignKey("integration.connector_catalog.connector_key", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    protocol = Column(String(32), nullable=False)
    base_url = Column(Text, nullable=True)
    auth_type = Column(String(64), nullable=False)
    auth_config_json = Column(JSONB, default=dict)
    is_global = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)


class ConnectorEnvironment(Base, ETLTrackingMixin):
    __tablename__ = "connector_environments"
    __table_args__ = (
        UniqueConstraint("connector_instance_id", "environment_name", name="uq_instance_env"),
        {"schema": "integration"}
    )

    id = Column(String(64), primary_key=True)
    connector_instance_id = Column(String(64), ForeignKey("integration.connector_instances.id", ondelete="CASCADE"), nullable=False)
    environment_name = Column(String(64), nullable=False)
    endpoint_override = Column(Text, nullable=True)
    credentials_ref = Column(String(128), nullable=True)
    notes = Column(Text, nullable=True)


class ProjectConnectorBinding(Base, ETLTrackingMixin):
    __tablename__ = "project_connector_bindings"
    __table_args__ = (
        UniqueConstraint("project_id", "connector_instance_id", name="uq_project_instance"),
        {"schema": "integration"}
    )

    id = Column(String(64), primary_key=True)
    project_id = Column(String(64), ForeignKey("control_plane.projects.id", ondelete="CASCADE"), nullable=False)
    connector_instance_id = Column(String(64), ForeignKey("integration.connector_instances.id", ondelete="CASCADE"), nullable=False)
    is_enabled = Column(Boolean, default=True, nullable=False)
    custom_alias = Column(String(128), nullable=True)
    notes = Column(Text, nullable=True)


class ProjectToolEnvMapping(Base, ETLTrackingMixin):
    __tablename__ = "project_tool_env_mappings"
    __table_args__ = (
        UniqueConstraint("project_id", "project_environment", "connector_instance_id", name="uq_proj_env_tool_mapping"),
        {"schema": "integration"}
    )

    id = Column(String(64), primary_key=True)
    project_id = Column(String(64), ForeignKey("control_plane.projects.id", ondelete="CASCADE"), nullable=False)
    project_environment = Column(String(64), nullable=False)
    connector_instance_id = Column(String(64), ForeignKey("integration.connector_instances.id", ondelete="CASCADE"), nullable=False)
    tool_environment = Column(String(64), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    notes = Column(Text, nullable=True)


class ConnectorHealth(Base, ETLTrackingMixin):
    __tablename__ = "connector_health"
    __table_args__ = {"schema": "integration"}

    id = Column(String(64), primary_key=True)
    connector_instance_id = Column(String(64), ForeignKey("integration.connector_instances.id", ondelete="CASCADE"), nullable=False)
    environment_name = Column(String(64), nullable=False)
    status = Column(String(32), nullable=False)
    latency_ms = Column(Integer, default=0, nullable=False)
    last_checked_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    consecutive_failures = Column(Integer, default=0, nullable=False)
    error_message = Column(Text, nullable=True)


# ========================================================================
# SCHEMA 4: runtime
# ========================================================================

class Conversation(Base, ETLTrackingMixin):
    __tablename__ = "conversations"
    __table_args__ = {"schema": "runtime"}

    id = Column(String(64), primary_key=True)
    project_id = Column(String(64), ForeignKey("control_plane.projects.id", ondelete="CASCADE"), nullable=False)
    environment = Column(String(64), nullable=False)
    user_id = Column(String(64), ForeignKey("iam.users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    status = Column(String(32), default="ACTIVE", nullable=False)
    summary = Column(Text, nullable=True)


class Message(Base, ETLTrackingMixin):
    __tablename__ = "messages"
    __table_args__ = {"schema": "runtime"}

    id = Column(String(64), primary_key=True)
    conversation_id = Column(String(64), ForeignKey("runtime.conversations.id", ondelete="CASCADE"), nullable=False)
    sender_type = Column(String(32), nullable=False)  # USER, ASSISTANT, SYSTEM, TOOL
    content = Column(Text, nullable=False)
    reasoning_text = Column(Text, nullable=True)
    tool_calls_json = Column(JSONB, default=list)
    attachments_json = Column(JSONB, default=list)
    tokens_used = Column(Integer, default=0)


class Run(Base, ETLTrackingMixin):
    __tablename__ = "runs"
    __table_args__ = {"schema": "runtime"}

    id = Column(String(64), primary_key=True)
    conversation_id = Column(String(64), ForeignKey("runtime.conversations.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(String(64), ForeignKey("control_plane.projects.id", ondelete="CASCADE"), nullable=False)
    environment = Column(String(64), nullable=False)
    profile_id = Column(String(64), default="deep_triage", nullable=False)
    status = Column(String(32), nullable=False)
    model_route = Column(String(128), nullable=False)
    started_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    total_tokens = Column(Integer, default=0)
    latency_ms = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)


class RunSnapshot(Base, ETLTrackingMixin):
    __tablename__ = "run_snapshots"
    __table_args__ = {"schema": "runtime"}

    id = Column(String(64), primary_key=True)
    run_id = Column(String(64), ForeignKey("runtime.runs.id", ondelete="CASCADE"), unique=True, nullable=False)
    resolved_skills_json = Column(JSONB, nullable=False)
    resolved_connectors_json = Column(JSONB, nullable=False)
    resolved_parameters_json = Column(JSONB, nullable=False)
    effective_env_mappings_json = Column(JSONB, nullable=False)
    sha256_hash = Column(String(64), nullable=False)


class RunEvent(Base, ETLTrackingMixin):
    __tablename__ = "run_events"
    __table_args__ = {"schema": "runtime"}

    id = Column(String(64), primary_key=True)
    run_id = Column(String(64), ForeignKey("runtime.runs.id", ondelete="CASCADE"), nullable=False)
    seq_no = Column(Integer, nullable=False)
    event_type = Column(String(64), nullable=False)
    payload_json = Column(JSONB, nullable=False)
    occurred_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)


class ToolCallRecord(Base, ETLTrackingMixin):
    __tablename__ = "tool_calls"
    __table_args__ = {"schema": "runtime"}

    id = Column(String(64), primary_key=True)
    run_id = Column(String(64), ForeignKey("runtime.runs.id", ondelete="CASCADE"), nullable=False)
    connector_instance_id = Column(String(64), nullable=False)
    tool_environment = Column(String(64), nullable=False)
    operation = Column(String(128), nullable=False)
    input_args_json = Column(JSONB, nullable=False)
    output_data_json = Column(JSONB, nullable=True)
    status = Column(String(32), nullable=False)
    duration_ms = Column(Integer, default=0, nullable=False)
    error_message = Column(Text, nullable=True)


class EvidenceItem(Base, ETLTrackingMixin):
    __tablename__ = "evidence_items"
    __table_args__ = {"schema": "runtime"}

    id = Column(String(64), primary_key=True)
    run_id = Column(String(64), ForeignKey("runtime.runs.id", ondelete="CASCADE"), nullable=False)
    source_system = Column(String(64), nullable=False)
    connector_instance_id = Column(String(64), nullable=False)
    tool_environment = Column(String(64), nullable=False)
    operation = Column(String(128), nullable=False)
    query_params_json = Column(JSONB, nullable=False)
    raw_payload_json = Column(JSONB, nullable=False)
    normalized_summary = Column(Text, nullable=False)
    confidence_score = Column(Double, default=1.0, nullable=False)
    content_sha256 = Column(String(64), nullable=False)
    is_redacted = Column(Boolean, default=False, nullable=False)
    relevance_rating = Column(String(32), default="VERIFIED")


class ActionProposal(Base, ETLTrackingMixin):
    __tablename__ = "action_proposals"
    __table_args__ = {"schema": "runtime"}

    id = Column(String(64), primary_key=True)
    run_id = Column(String(64), ForeignKey("runtime.runs.id", ondelete="CASCADE"), nullable=False)
    connector_instance_id = Column(String(64), nullable=False)
    tool_environment = Column(String(64), nullable=False)
    operation = Column(String(128), nullable=False)
    target_resource_json = Column(JSONB, nullable=False)
    payload_json = Column(JSONB, nullable=False)
    diff_preview = Column(Text, nullable=True)
    risk_level = Column(String(32), nullable=False)  # LOW_RISK, MEDIUM_RISK, HIGH_IMPACT
    required_role = Column(String(64), default="TRIAGE_ENGINEER", nullable=False)
    status = Column(String(32), default="PENDING_APPROVAL", nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    canonical_hash = Column(String(64), nullable=False)


class ActionExecution(Base, ETLTrackingMixin):
    __tablename__ = "action_executions"
    __table_args__ = {"schema": "runtime"}

    id = Column(String(64), primary_key=True)
    proposal_id = Column(String(64), ForeignKey("runtime.action_proposals.id", ondelete="CASCADE"), unique=True, nullable=False)
    approver_user_id = Column(String(64), ForeignKey("iam.users.id"), nullable=False)
    approval_decision = Column(String(32), nullable=False)
    approver_notes = Column(Text, nullable=True)
    delegated_identity = Column(String(255), nullable=False)
    execution_status = Column(String(32), nullable=False)
    external_ref = Column(String(255), nullable=True)
    result_payload_json = Column(JSONB, nullable=True)
    executed_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)


# ========================================================================
# SCHEMA 5: okf_knowledge
# ========================================================================

class OkfTriagedCase(Base, ETLTrackingMixin):
    __tablename__ = "okf_triaged_cases"
    __table_args__ = {"schema": "okf_knowledge"}

    id = Column(String(64), primary_key=True)
    incident_id = Column(String(64), nullable=False)
    project_id = Column(String(64), ForeignKey("control_plane.projects.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    issue_signature = Column(Text, nullable=False)
    root_cause = Column(Text, nullable=False)
    resolution_summary = Column(Text, nullable=False)
    resolved_actions_json = Column(JSONB, default=list)
    key_evidence_ids = Column(JSONB, default=list)
    tags = Column(JSONB, default=list)
    mttr_minutes = Column(Integer, default=0)
    confidence_score = Column(Double, default=1.0, nullable=False)
    verified_by_user_id = Column(String(64), ForeignKey("iam.users.id"), nullable=True)
    times_referenced = Column(Integer, default=0, nullable=False)


class OkfEntity(Base, ETLTrackingMixin):
    __tablename__ = "okf_entities"
    __table_args__ = (
        UniqueConstraint("entity_name", "entity_type", "project_id", name="uq_entity"),
        {"schema": "okf_knowledge"}
    )

    id = Column(String(64), primary_key=True)
    entity_name = Column(String(255), nullable=False)
    entity_type = Column(String(64), nullable=False)  # SERVICE, ERROR_CODE, DATABASE, API_ENDPOINT, INFRA_NODE
    project_id = Column(String(64), ForeignKey("control_plane.projects.id", ondelete="CASCADE"), nullable=True)
    metadata_json = Column(JSONB, default=dict)


class OkfKnowledgeNode(Base, ETLTrackingMixin):
    __tablename__ = "okf_knowledge_nodes"
    __table_args__ = {"schema": "okf_knowledge"}

    id = Column(String(64), primary_key=True)
    parent_node_id = Column(String(64), ForeignKey("okf_knowledge.okf_knowledge_nodes.id"), nullable=True)
    title = Column(String(255), nullable=False)
    category = Column(String(64), nullable=False)  # RUNBOOK, ARCHITECTURE, KNOWN_BUG, POST_MORTEM
    content_markdown = Column(Text, nullable=False)
    solution_steps_json = Column(JSONB, default=list)
    applicability_rules_json = Column(JSONB, default=dict)
    helpful_score = Column(Integer, default=0, nullable=False)
    usage_count = Column(Integer, default=0, nullable=False)


class OkfFeedbackSignal(Base, ETLTrackingMixin):
    __tablename__ = "okf_feedback_signals"
    __table_args__ = {"schema": "okf_knowledge"}

    id = Column(String(64), primary_key=True)
    source_type = Column(String(32), nullable=False)  # MESSAGE, EVIDENCE, ACTION, CASE
    source_id = Column(String(64), nullable=False)
    user_id = Column(String(64), ForeignKey("iam.users.id"), nullable=False)
    signal_type = Column(String(64), nullable=False)  # THUMBS_UP, THUMBS_DOWN, RELEVANCE_FLAG, ROOT_CAUSE_CONFIRMED, ACTION_ACCEPTED, RATING_1_5
    feedback_score = Column(Integer, nullable=True)
    qualitative_notes = Column(Text, nullable=True)
    submitted_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)


# ========================================================================
# SCHEMA 6: audit_analytics
# ========================================================================

class AuditEvent(Base, ETLTrackingMixin):
    __tablename__ = "audit_events"
    __table_args__ = {"schema": "audit_analytics"}

    id = Column(String(64), primary_key=True)
    actor_id = Column(String(64), nullable=False)
    action_type = Column(String(64), nullable=False)
    resource_type = Column(String(64), nullable=False)
    resource_id = Column(String(64), nullable=False)
    project_id = Column(String(64), nullable=True)
    environment = Column(String(64), nullable=True)
    ip_address = Column(String(45), nullable=True)
    details_json = Column(JSONB, default=dict)
    occurred_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)


class RunMetric(Base, ETLTrackingMixin):
    __tablename__ = "run_metrics"
    __table_args__ = {"schema": "audit_analytics"}

    id = Column(String(64), primary_key=True)
    run_id = Column(String(64), ForeignKey("runtime.runs.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(String(64), nullable=False)
    environment = Column(String(64), nullable=False)
    time_to_first_token_ms = Column(Integer, default=0, nullable=False)
    total_duration_ms = Column(Integer, default=0, nullable=False)
    prompt_tokens = Column(Integer, default=0, nullable=False)
    completion_tokens = Column(Integer, default=0, nullable=False)
    tool_invocations_count = Column(Integer, default=0, nullable=False)
    action_proposals_count = Column(Integer, default=0, nullable=False)
    status = Column(String(32), nullable=False)


class ConnectorMetric(Base, ETLTrackingMixin):
    __tablename__ = "connector_metrics"
    __table_args__ = (
        UniqueConstraint("connector_id", "tool_environment", "operation", "date_bucket", name="uq_connector_metric_bucket"),
        {"schema": "audit_analytics"}
    )

    id = Column(String(64), primary_key=True)
    connector_id = Column(String(64), nullable=False)
    tool_environment = Column(String(64), nullable=False)
    operation = Column(String(128), nullable=False)
    call_count = Column(Integer, default=0, nullable=False)
    error_count = Column(Integer, default=0, nullable=False)
    avg_latency_ms = Column(Integer, default=0, nullable=False)
    p95_latency_ms = Column(Integer, default=0, nullable=False)
    date_bucket = Column(DateTime(timezone=True), nullable=False)


class EtlSyncHistory(Base, ETLTrackingMixin):
    __tablename__ = "etl_sync_history"
    __table_args__ = {"schema": "audit_analytics"}

    id = Column(String(64), primary_key=True)
    etl_job_id = Column(String(64), nullable=False)
    schema_name = Column(String(64), nullable=False)
    table_name = Column(String(64), nullable=False)
    rows_synced = Column(Integer, default=0, nullable=False)
    sync_status = Column(String(32), nullable=False)
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=False)
