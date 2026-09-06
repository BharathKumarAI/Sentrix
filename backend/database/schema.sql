CREATE SCHEMA IF NOT EXISTS audit_analytics;

CREATE SCHEMA IF NOT EXISTS control_plane;

CREATE SCHEMA IF NOT EXISTS iam;

CREATE SCHEMA IF NOT EXISTS integration;

CREATE SCHEMA IF NOT EXISTS okf_knowledge;

CREATE SCHEMA IF NOT EXISTS runtime;


CREATE TABLE IF NOT EXISTS audit_analytics.audit_events (
	id VARCHAR(64) NOT NULL, 
	actor_id VARCHAR(64) NOT NULL, 
	action_type VARCHAR(64) NOT NULL, 
	resource_type VARCHAR(64) NOT NULL, 
	resource_id VARCHAR(64) NOT NULL, 
	project_id VARCHAR(64), 
	environment VARCHAR(64), 
	ip_address VARCHAR(45), 
	details_json JSONB, 
	occurred_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	source_system VARCHAR(64) NOT NULL, 
	PRIMARY KEY (id)
)

;


CREATE TABLE IF NOT EXISTS audit_analytics.connector_metrics (
	id VARCHAR(64) NOT NULL, 
	connector_id VARCHAR(64) NOT NULL, 
	tool_environment VARCHAR(64) NOT NULL, 
	operation VARCHAR(128) NOT NULL, 
	call_count INTEGER NOT NULL, 
	error_count INTEGER NOT NULL, 
	avg_latency_ms INTEGER NOT NULL, 
	p95_latency_ms INTEGER NOT NULL, 
	date_bucket TIMESTAMP WITH TIME ZONE NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	source_system VARCHAR(64) NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_connector_metric_bucket UNIQUE (connector_id, tool_environment, operation, date_bucket)
)

;


CREATE TABLE IF NOT EXISTS audit_analytics.etl_sync_history (
	id VARCHAR(64) NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	schema_name VARCHAR(64) NOT NULL, 
	table_name VARCHAR(64) NOT NULL, 
	rows_synced INTEGER NOT NULL, 
	sync_status VARCHAR(32) NOT NULL, 
	error_message TEXT, 
	started_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	completed_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	source_system VARCHAR(64) NOT NULL, 
	PRIMARY KEY (id)
)

;


CREATE TABLE IF NOT EXISTS control_plane.harness_configurations (
	id VARCHAR(64) NOT NULL, 
	scope_type VARCHAR(32) NOT NULL, 
	scope_id VARCHAR(64) NOT NULL, 
	configuration JSONB NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	source_system VARCHAR(64) NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_harness_scope UNIQUE (scope_type, scope_id)
)

;


CREATE TABLE IF NOT EXISTS control_plane.harness_execution_modes (
	key VARCHAR(64) NOT NULL, 
	name VARCHAR(255) NOT NULL, 
	description TEXT NOT NULL, 
	badge VARCHAR(64) NOT NULL, 
	badge_color VARCHAR(64) NOT NULL, 
	is_active BOOLEAN NOT NULL, 
	read_only BOOLEAN NOT NULL, 
	governance_level VARCHAR(64) NOT NULL, 
	default_plugins JSONB NOT NULL, 
	allowed_categories JSONB NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	source_system VARCHAR(64) NOT NULL, 
	PRIMARY KEY (key)
)

;


CREATE TABLE IF NOT EXISTS control_plane.harness_plugins (
	id VARCHAR(64) NOT NULL, 
	name VARCHAR(255) NOT NULL, 
	version VARCHAR(32) NOT NULL, 
	category VARCHAR(64) NOT NULL, 
	description TEXT NOT NULL, 
	author VARCHAR(128) NOT NULL, 
	status VARCHAR(32) NOT NULL, 
	capabilities JSONB NOT NULL, 
	dependencies JSONB NOT NULL, 
	config_schema JSONB NOT NULL, 
	active_config JSONB NOT NULL, 
	tags JSONB NOT NULL, 
	cost_tier VARCHAR(32) NOT NULL, 
	estimated_usd_per_invocation DOUBLE PRECISION NOT NULL, 
	total_invocations INTEGER NOT NULL, 
	total_tokens_consumed BIGINT NOT NULL, 
	total_cost_usd DOUBLE PRECISION NOT NULL, 
	avg_latency_ms DOUBLE PRECISION NOT NULL, 
	error_count INTEGER NOT NULL, 
	last_invoked_at TIMESTAMP WITH TIME ZONE, 
	mounted_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	source_system VARCHAR(64) NOT NULL, 
	PRIMARY KEY (id)
)

;


CREATE TABLE IF NOT EXISTS control_plane.model_providers (
	id VARCHAR(64) NOT NULL, 
	provider_key VARCHAR(64) NOT NULL, 
	name VARCHAR(255) NOT NULL, 
	models JSONB NOT NULL, 
	role VARCHAR(255) NOT NULL, 
	status VARCHAR(32) NOT NULL, 
	latency_str VARCHAR(32) NOT NULL, 
	quota_rpm INTEGER NOT NULL, 
	current_usage_pct INTEGER NOT NULL, 
	fallback_priority INTEGER NOT NULL, 
	description TEXT, 
	credentials_json JSONB, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	source_system VARCHAR(64) NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (provider_key)
)

;


CREATE TABLE IF NOT EXISTS control_plane.parameter_definitions (
	parameter_key VARCHAR(128) NOT NULL, 
	connector_id VARCHAR(64), 
	scope_level VARCHAR(64) NOT NULL, 
	data_type VARCHAR(32) NOT NULL, 
	default_value_json JSONB NOT NULL, 
	validation_rules_json JSONB, 
	is_secret BOOLEAN NOT NULL, 
	ui_section VARCHAR(64) NOT NULL, 
	display_name VARCHAR(255) NOT NULL, 
	description TEXT, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	source_system VARCHAR(64) NOT NULL, 
	PRIMARY KEY (parameter_key)
)

;


CREATE TABLE IF NOT EXISTS control_plane.prompt_templates (
	id VARCHAR(64) NOT NULL, 
	name VARCHAR(255) NOT NULL, 
	description TEXT, 
	scope VARCHAR(64) NOT NULL, 
	category VARCHAR(64) NOT NULL, 
	owner VARCHAR(128) NOT NULL, 
	visibility VARCHAR(128) NOT NULL, 
	status VARCHAR(32) NOT NULL, 
	used_by VARCHAR(128) NOT NULL, 
	executions_count INTEGER NOT NULL, 
	system_directives TEXT, 
	user_template TEXT, 
	is_favorite BOOLEAN NOT NULL, 
	project_id VARCHAR(64), 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	source_system VARCHAR(64) NOT NULL, 
	PRIMARY KEY (id)
)

;


CREATE TABLE IF NOT EXISTS control_plane.security_policies (
	id VARCHAR(64) NOT NULL, 
	policy_key VARCHAR(64) NOT NULL, 
	name VARCHAR(255) NOT NULL, 
	category VARCHAR(64) NOT NULL, 
	description TEXT NOT NULL, 
	enforcement_level VARCHAR(32) NOT NULL, 
	is_enabled BOOLEAN NOT NULL, 
	rules_json JSONB, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	source_system VARCHAR(64) NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (policy_key)
)

;


CREATE TABLE IF NOT EXISTS control_plane.stage_model_configs (
	id VARCHAR(64) NOT NULL, 
	stage_key VARCHAR(64) NOT NULL, 
	stage_name VARCHAR(128) NOT NULL, 
	category VARCHAR(64) NOT NULL, 
	description TEXT, 
	primary_model_id VARCHAR(128) NOT NULL, 
	primary_model_name VARCHAR(128) NOT NULL, 
	provider_id VARCHAR(64) NOT NULL, 
	provider_name VARCHAR(128) NOT NULL, 
	fallback_model_id VARCHAR(128), 
	fallback_model_name VARCHAR(128), 
	fallback_provider_id VARCHAR(64), 
	fallback_provider_name VARCHAR(128), 
	temperature DOUBLE PRECISION NOT NULL, 
	max_tokens INTEGER NOT NULL, 
	timeout_seconds INTEGER NOT NULL, 
	is_active BOOLEAN NOT NULL, 
	routing_strategy VARCHAR(64) NOT NULL, 
	parameters_json JSONB NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	source_system VARCHAR(64) NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (stage_key)
)

;


CREATE TABLE IF NOT EXISTS iam.api_keys (
	id VARCHAR(64) NOT NULL, 
	name VARCHAR(255) NOT NULL, 
	service VARCHAR(128) NOT NULL, 
	masked VARCHAR(128) NOT NULL, 
	raw_key VARCHAR(255) NOT NULL, 
	scope VARCHAR(128) NOT NULL, 
	key_type VARCHAR(32) NOT NULL, 
	owner_user_id VARCHAR(64), 
	owner_email VARCHAR(255), 
	project_id VARCHAR(64), 
	source VARCHAR(64) NOT NULL, 
	description TEXT, 
	vault_managed BOOLEAN NOT NULL, 
	last_rotated VARCHAR(64) NOT NULL, 
	expires_in VARCHAR(64) NOT NULL, 
	status VARCHAR(32) NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	source_system VARCHAR(64) NOT NULL, 
	PRIMARY KEY (id)
)

;


CREATE TABLE IF NOT EXISTS iam.organizations (
	id VARCHAR(64) NOT NULL, 
	name VARCHAR(255) NOT NULL, 
	slug VARCHAR(64) NOT NULL, 
	settings_json JSONB NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	source_system VARCHAR(64) NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (slug)
)

;


CREATE TABLE IF NOT EXISTS iam.role_definitions (
	id VARCHAR(64) NOT NULL, 
	role_key VARCHAR(64) NOT NULL, 
	display_name VARCHAR(128) NOT NULL, 
	scope VARCHAR(32) NOT NULL, 
	description TEXT, 
	capabilities JSONB NOT NULL, 
	is_system_role BOOLEAN NOT NULL, 
	is_custom BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	source_system VARCHAR(64) NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (role_key)
)

;


CREATE TABLE IF NOT EXISTS iam.users (
	id VARCHAR(64) NOT NULL, 
	email VARCHAR(255) NOT NULL, 
	full_name VARCHAR(255) NOT NULL, 
	role VARCHAR(64) NOT NULL, 
	department VARCHAR(128), 
	avatar_url TEXT, 
	preferences_json JSONB, 
	is_active BOOLEAN, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	source_system VARCHAR(64) NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (email)
)

;


CREATE TABLE IF NOT EXISTS integration.connector_catalog (
	id VARCHAR(64) NOT NULL, 
	connector_key VARCHAR(64) NOT NULL, 
	name VARCHAR(255) NOT NULL, 
	description TEXT, 
	category VARCHAR(64) NOT NULL, 
	icon_name VARCHAR(64) NOT NULL, 
	supported_protocols JSONB NOT NULL, 
	capabilities JSONB NOT NULL, 
	is_admin_enabled BOOLEAN NOT NULL, 
	documentation_url TEXT, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	source_system VARCHAR(64) NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (connector_key)
)

;


CREATE TABLE IF NOT EXISTS integration.tool_definitions (
	id VARCHAR(64) NOT NULL, 
	tool_key VARCHAR(64) NOT NULL, 
	display_name VARCHAR(255) NOT NULL, 
	category VARCHAR(64) NOT NULL, 
	provider VARCHAR(64) NOT NULL, 
	description TEXT, 
	platform_managed BOOLEAN NOT NULL, 
	available_to_all_projects BOOLEAN NOT NULL, 
	supports_environments BOOLEAN NOT NULL, 
	environment_mode VARCHAR(64) NOT NULL, 
	supported_integration_modes JSONB NOT NULL, 
	default_integration_mode VARCHAR(32) NOT NULL, 
	capabilities JSONB NOT NULL, 
	config_schema_json JSONB NOT NULL, 
	is_active BOOLEAN NOT NULL, 
	version VARCHAR(32) NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	source_system VARCHAR(64) NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (tool_key)
)

;


CREATE TABLE IF NOT EXISTS okf_knowledge.okf_knowledge_nodes (
	id VARCHAR(64) NOT NULL, 
	parent_node_id VARCHAR(64), 
	title VARCHAR(255) NOT NULL, 
	category VARCHAR(64) NOT NULL, 
	content_markdown TEXT NOT NULL, 
	solution_steps_json JSONB, 
	applicability_rules_json JSONB, 
	helpful_score INTEGER NOT NULL, 
	usage_count INTEGER NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	source_system VARCHAR(64) NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(parent_node_id) REFERENCES okf_knowledge.okf_knowledge_nodes (id)
)

;


CREATE TABLE IF NOT EXISTS iam.project_memberships (
	id VARCHAR(64) NOT NULL, 
	project_id VARCHAR(64) NOT NULL, 
	user_id VARCHAR(64) NOT NULL, 
	project_role VARCHAR(64) NOT NULL, 
	granted_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	source_system VARCHAR(64) NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_user_project UNIQUE (project_id, user_id), 
	FOREIGN KEY(user_id) REFERENCES iam.users (id) ON DELETE CASCADE
)

;


CREATE TABLE IF NOT EXISTS iam.sessions (
	id VARCHAR(64) NOT NULL, 
	user_id VARCHAR(64) NOT NULL, 
	active_project_id VARCHAR(64), 
	active_environment VARCHAR(64), 
	delegated_credentials_json JSONB, 
	expires_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	source_system VARCHAR(64) NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES iam.users (id) ON DELETE CASCADE
)

;


CREATE TABLE IF NOT EXISTS iam.teams (
	id VARCHAR(64) NOT NULL, 
	organization_id VARCHAR(64) NOT NULL, 
	name VARCHAR(255) NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	source_system VARCHAR(64) NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (organization_id, name), 
	FOREIGN KEY(organization_id) REFERENCES iam.organizations (id)
)

;


CREATE TABLE IF NOT EXISTS integration.tool_field_definitions (
	id VARCHAR(64) NOT NULL, 
	tool_key VARCHAR(64) NOT NULL, 
	field_key VARCHAR(128) NOT NULL, 
	label VARCHAR(255) NOT NULL, 
	description TEXT, 
	data_type VARCHAR(32) NOT NULL, 
	requirement_mode VARCHAR(32) NOT NULL, 
	required_when_json JSONB, 
	default_value_json JSONB, 
	allowed_values_json JSONB NOT NULL, 
	validation_json JSONB NOT NULL, 
	secret BOOLEAN NOT NULL, 
	scope_json JSONB NOT NULL, 
	editable_at_json JSONB NOT NULL, 
	inheritable BOOLEAN NOT NULL, 
	overridable BOOLEAN NOT NULL, 
	environment_specific BOOLEAN NOT NULL, 
	ui_json JSONB NOT NULL, 
	is_active BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	source_system VARCHAR(64) NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_tool_field UNIQUE (tool_key, field_key), 
	FOREIGN KEY(tool_key) REFERENCES integration.tool_definitions (tool_key) ON DELETE CASCADE
)

;


CREATE TABLE IF NOT EXISTS integration.tool_instances (
	id VARCHAR(64) NOT NULL, 
	tool_key VARCHAR(64) NOT NULL, 
	instance_key VARCHAR(64) NOT NULL, 
	display_name VARCHAR(255) NOT NULL, 
	base_url TEXT, 
	auth_mode VARCHAR(64) NOT NULL, 
	credential_ref VARCHAR(255), 
	config_json JSONB NOT NULL, 
	is_active BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	source_system VARCHAR(64) NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(tool_key) REFERENCES integration.tool_definitions (tool_key) ON DELETE CASCADE, 
	UNIQUE (instance_key)
)

;


CREATE TABLE IF NOT EXISTS integration.tool_operations (
	id VARCHAR(64) NOT NULL, 
	tool_key VARCHAR(64) NOT NULL, 
	operation_key VARCHAR(128) NOT NULL, 
	display_name VARCHAR(255) NOT NULL, 
	capability VARCHAR(64) NOT NULL, 
	description TEXT, 
	read_only BOOLEAN NOT NULL, 
	idempotent BOOLEAN NOT NULL, 
	requires_approval BOOLEAN NOT NULL, 
	batch_supported BOOLEAN NOT NULL, 
	timeout_ms INTEGER NOT NULL, 
	max_retries INTEGER NOT NULL, 
	concurrency_limit INTEGER NOT NULL, 
	cost_class VARCHAR(32) NOT NULL, 
	data_classification VARCHAR(32) NOT NULL, 
	source_type VARCHAR(64) NOT NULL, 
	required_signals_json JSONB NOT NULL, 
	accepted_signals_json JSONB NOT NULL, 
	produced_signals_json JSONB NOT NULL, 
	input_schema_json JSONB NOT NULL, 
	output_schema_json JSONB NOT NULL, 
	is_active BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	source_system VARCHAR(64) NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_tool_operation UNIQUE (tool_key, operation_key), 
	FOREIGN KEY(tool_key) REFERENCES integration.tool_definitions (tool_key) ON DELETE CASCADE
)

;


CREATE TABLE IF NOT EXISTS okf_knowledge.okf_feedback_signals (
	id VARCHAR(64) NOT NULL, 
	source_type VARCHAR(32) NOT NULL, 
	source_id VARCHAR(64) NOT NULL, 
	user_id VARCHAR(64) NOT NULL, 
	signal_type VARCHAR(64) NOT NULL, 
	feedback_score INTEGER, 
	qualitative_notes TEXT, 
	submitted_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	source_system VARCHAR(64) NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES iam.users (id)
)

;


CREATE TABLE IF NOT EXISTS control_plane.projects (
	id VARCHAR(64) NOT NULL, 
	project_key VARCHAR(32) NOT NULL, 
	organization_id VARCHAR(64), 
	team_id VARCHAR(64), 
	name VARCHAR(255) NOT NULL, 
	description TEXT, 
	owner_id VARCHAR(64), 
	status VARCHAR(32) NOT NULL, 
	is_followed BOOLEAN NOT NULL, 
	default_environment VARCHAR(64), 
	tags JSONB, 
	criticality_tier VARCHAR(64), 
	ticketing_system VARCHAR(64), 
	sla_config_json JSONB, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	source_system VARCHAR(64) NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (project_key), 
	FOREIGN KEY(organization_id) REFERENCES iam.organizations (id), 
	FOREIGN KEY(team_id) REFERENCES iam.teams (id), 
	FOREIGN KEY(owner_id) REFERENCES iam.users (id)
)

;


CREATE TABLE IF NOT EXISTS integration.tool_instance_environments (
	id VARCHAR(64) NOT NULL, 
	instance_key VARCHAR(64) NOT NULL, 
	environment_name VARCHAR(64) NOT NULL, 
	endpoint_override TEXT, 
	credential_ref VARCHAR(255), 
	environment_filter_json JSONB NOT NULL, 
	is_active BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	source_system VARCHAR(64) NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_instance_env_rec UNIQUE (instance_key, environment_name), 
	FOREIGN KEY(instance_key) REFERENCES integration.tool_instances (instance_key) ON DELETE CASCADE
)

;


CREATE TABLE IF NOT EXISTS control_plane.parameter_values (
	id VARCHAR(64) NOT NULL, 
	parameter_key VARCHAR(128) NOT NULL, 
	level VARCHAR(32) NOT NULL, 
	project_id VARCHAR(64), 
	user_id VARCHAR(64), 
	configured_value_json JSONB NOT NULL, 
	is_active BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	source_system VARCHAR(64) NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(parameter_key) REFERENCES control_plane.parameter_definitions (parameter_key) ON DELETE CASCADE, 
	FOREIGN KEY(project_id) REFERENCES control_plane.projects (id) ON DELETE CASCADE, 
	FOREIGN KEY(user_id) REFERENCES iam.users (id) ON DELETE CASCADE
)

;


CREATE TABLE IF NOT EXISTS control_plane.project_display_configs (
	id VARCHAR(64) NOT NULL, 
	project_id VARCHAR(64) NOT NULL, 
	connector_id VARCHAR(64) NOT NULL, 
	display_mode VARCHAR(64) NOT NULL, 
	priority_fields JSONB, 
	hidden_fields JSONB, 
	custom_formatting_rules JSONB, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	source_system VARCHAR(64) NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_proj_connector_display UNIQUE (project_id, connector_id), 
	FOREIGN KEY(project_id) REFERENCES control_plane.projects (id) ON DELETE CASCADE
)

;


CREATE TABLE IF NOT EXISTS control_plane.project_environments (
	id VARCHAR(64) NOT NULL, 
	project_id VARCHAR(64) NOT NULL, 
	environment_name VARCHAR(64) NOT NULL, 
	is_default BOOLEAN NOT NULL, 
	description TEXT, 
	egress_boundary VARCHAR(128), 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	source_system VARCHAR(64) NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_proj_env UNIQUE (project_id, environment_name), 
	FOREIGN KEY(project_id) REFERENCES control_plane.projects (id) ON DELETE CASCADE
)

;


CREATE TABLE IF NOT EXISTS control_plane.project_setup_instructions (
	id VARCHAR(64) NOT NULL, 
	project_id VARCHAR(64) NOT NULL, 
	prompt_directives TEXT NOT NULL, 
	triage_guidelines TEXT, 
	domain_context TEXT, 
	escalation_policy TEXT, 
	updated_by VARCHAR(64), 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	source_system VARCHAR(64) NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (project_id), 
	FOREIGN KEY(project_id) REFERENCES control_plane.projects (id) ON DELETE CASCADE, 
	FOREIGN KEY(updated_by) REFERENCES iam.users (id)
)

;


CREATE TABLE IF NOT EXISTS control_plane.project_skill_bindings (
	id VARCHAR(64) NOT NULL, 
	project_id VARCHAR(64) NOT NULL, 
	skill_key VARCHAR(64) NOT NULL, 
	skill_version VARCHAR(32) NOT NULL, 
	custom_instructions TEXT, 
	parameter_overrides_json JSONB NOT NULL, 
	approval_policy VARCHAR(64) NOT NULL, 
	is_enabled BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	source_system VARCHAR(64) NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_project_skill UNIQUE (project_id, skill_key), 
	FOREIGN KEY(project_id) REFERENCES control_plane.projects (id) ON DELETE CASCADE
)

;


CREATE TABLE IF NOT EXISTS control_plane.skill_definitions (
	id VARCHAR(64) NOT NULL, 
	skill_key VARCHAR(64) NOT NULL, 
	name VARCHAR(255) NOT NULL, 
	version VARCHAR(32) NOT NULL, 
	category VARCHAR(64) NOT NULL, 
	scope VARCHAR(32) NOT NULL, 
	owner VARCHAR(128) NOT NULL, 
	visibility VARCHAR(32) NOT NULL, 
	source_type VARCHAR(32) NOT NULL, 
	repository_url VARCHAR(512), 
	commit_sha VARCHAR(64), 
	package_uri VARCHAR(512), 
	package_hash VARCHAR(64), 
	intents_json JSONB NOT NULL, 
	required_capabilities_json JSONB NOT NULL, 
	optional_capabilities_json JSONB NOT NULL, 
	accepted_signals_json JSONB NOT NULL, 
	instructions_markdown TEXT NOT NULL, 
	output_spec_json JSONB NOT NULL, 
	workflow_spec_json JSONB NOT NULL, 
	policies_json JSONB NOT NULL, 
	parameters_json JSONB NOT NULL, 
	lifecycle_status VARCHAR(32) NOT NULL, 
	invocations_count INTEGER NOT NULL, 
	target_project_id VARCHAR(64), 
	is_active BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	source_system VARCHAR(64) NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_skill_version UNIQUE (skill_key, version), 
	FOREIGN KEY(target_project_id) REFERENCES control_plane.projects (id) ON DELETE SET NULL
)

;


CREATE TABLE IF NOT EXISTS control_plane.user_skills (
	id VARCHAR(64) NOT NULL, 
	user_id VARCHAR(64) NOT NULL, 
	project_id VARCHAR(64), 
	name VARCHAR(255) NOT NULL, 
	skill_key VARCHAR(64) NOT NULL, 
	extends_skill_key VARCHAR(64), 
	custom_instructions TEXT NOT NULL, 
	preferences_json JSONB NOT NULL, 
	is_private BOOLEAN NOT NULL, 
	is_active BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	source_system VARCHAR(64) NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_user_skill UNIQUE (user_id, skill_key), 
	FOREIGN KEY(project_id) REFERENCES control_plane.projects (id) ON DELETE CASCADE
)

;


CREATE TABLE IF NOT EXISTS integration.connector_instances (
	id VARCHAR(64) NOT NULL, 
	instance_key VARCHAR(64) NOT NULL, 
	connector_key VARCHAR(64) NOT NULL, 
	name VARCHAR(255) NOT NULL, 
	protocol VARCHAR(32) NOT NULL, 
	base_url TEXT, 
	auth_type VARCHAR(64) NOT NULL, 
	auth_config_json JSONB, 
	is_global BOOLEAN NOT NULL, 
	is_active BOOLEAN NOT NULL, 
	scope VARCHAR(32) NOT NULL, 
	owning_project_id VARCHAR(64), 
	override_policy_json JSONB, 
	test_status VARCHAR(32) NOT NULL, 
	last_tested_at TIMESTAMP WITH TIME ZONE, 
	test_latency_ms INTEGER NOT NULL, 
	test_details_json JSONB, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	source_system VARCHAR(64) NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (instance_key), 
	FOREIGN KEY(connector_key) REFERENCES integration.connector_catalog (connector_key) ON DELETE CASCADE, 
	FOREIGN KEY(owning_project_id) REFERENCES control_plane.projects (id) ON DELETE CASCADE
)

;


CREATE TABLE IF NOT EXISTS integration.project_tools (
	id VARCHAR(64) NOT NULL, 
	project_id VARCHAR(64) NOT NULL, 
	tool_key VARCHAR(64) NOT NULL, 
	is_enabled BOOLEAN NOT NULL, 
	inherited_from_platform BOOLEAN NOT NULL, 
	allowed_capabilities_json JSONB NOT NULL, 
	denied_capabilities_json JSONB NOT NULL, 
	custom_policies_json JSONB NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	source_system VARCHAR(64) NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_project_tool UNIQUE (project_id, tool_key), 
	FOREIGN KEY(project_id) REFERENCES control_plane.projects (id) ON DELETE CASCADE, 
	FOREIGN KEY(tool_key) REFERENCES integration.tool_definitions (tool_key) ON DELETE CASCADE
)

;


CREATE TABLE IF NOT EXISTS integration.tool_field_mappings (
	id VARCHAR(64) NOT NULL, 
	project_id VARCHAR(64) NOT NULL, 
	provider VARCHAR(64) NOT NULL, 
	native_field_id VARCHAR(128) NOT NULL, 
	native_field_name VARCHAR(255), 
	canonical_signal VARCHAR(128) NOT NULL, 
	is_active BOOLEAN NOT NULL, 
	notes TEXT, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	source_system VARCHAR(64) NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_field_mapping UNIQUE (project_id, provider, native_field_id), 
	FOREIGN KEY(project_id) REFERENCES control_plane.projects (id) ON DELETE CASCADE
)

;


CREATE TABLE IF NOT EXISTS okf_knowledge.okf_entities (
	id VARCHAR(64) NOT NULL, 
	entity_name VARCHAR(255) NOT NULL, 
	entity_type VARCHAR(64) NOT NULL, 
	project_id VARCHAR(64), 
	metadata_json JSONB, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	source_system VARCHAR(64) NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_entity UNIQUE (entity_name, entity_type, project_id), 
	FOREIGN KEY(project_id) REFERENCES control_plane.projects (id) ON DELETE CASCADE
)

;


CREATE TABLE IF NOT EXISTS okf_knowledge.okf_triaged_cases (
	id VARCHAR(64) NOT NULL, 
	incident_id VARCHAR(64) NOT NULL, 
	project_id VARCHAR(64) NOT NULL, 
	title VARCHAR(255) NOT NULL, 
	issue_signature TEXT NOT NULL, 
	root_cause TEXT NOT NULL, 
	resolution_summary TEXT NOT NULL, 
	resolved_actions_json JSONB, 
	key_evidence_ids JSONB, 
	tags JSONB, 
	mttr_minutes INTEGER, 
	confidence_score DOUBLE PRECISION NOT NULL, 
	verified_by_user_id VARCHAR(64), 
	times_referenced INTEGER NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	source_system VARCHAR(64) NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(project_id) REFERENCES control_plane.projects (id) ON DELETE CASCADE, 
	FOREIGN KEY(verified_by_user_id) REFERENCES iam.users (id)
)

;


CREATE TABLE IF NOT EXISTS runtime.board_tickets (
	id VARCHAR(64) NOT NULL, 
	project_id VARCHAR(64) NOT NULL, 
	ticket_key VARCHAR(128) NOT NULL, 
	data_json JSONB NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	source_system VARCHAR(64) NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (project_id, ticket_key), 
	FOREIGN KEY(project_id) REFERENCES control_plane.projects (id)
)

;


CREATE TABLE IF NOT EXISTS runtime.conversations (
	id VARCHAR(64) NOT NULL, 
	project_id VARCHAR(64) NOT NULL, 
	environment VARCHAR(64) NOT NULL, 
	user_id VARCHAR(64) NOT NULL, 
	title VARCHAR(255) NOT NULL, 
	status VARCHAR(32) NOT NULL, 
	summary TEXT, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	source_system VARCHAR(64) NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(project_id) REFERENCES control_plane.projects (id) ON DELETE CASCADE, 
	FOREIGN KEY(user_id) REFERENCES iam.users (id)
)

;


CREATE TABLE IF NOT EXISTS integration.connector_environments (
	id VARCHAR(64) NOT NULL, 
	connector_instance_id VARCHAR(64) NOT NULL, 
	environment_name VARCHAR(64) NOT NULL, 
	endpoint_override TEXT, 
	credentials_ref VARCHAR(128), 
	notes TEXT, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	source_system VARCHAR(64) NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_instance_env UNIQUE (connector_instance_id, environment_name), 
	FOREIGN KEY(connector_instance_id) REFERENCES integration.connector_instances (id) ON DELETE CASCADE
)

;


CREATE TABLE IF NOT EXISTS integration.connector_health (
	id VARCHAR(64) NOT NULL, 
	connector_instance_id VARCHAR(64) NOT NULL, 
	environment_name VARCHAR(64) NOT NULL, 
	status VARCHAR(32) NOT NULL, 
	latency_ms INTEGER NOT NULL, 
	last_checked_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	consecutive_failures INTEGER NOT NULL, 
	error_message TEXT, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	source_system VARCHAR(64) NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(connector_instance_id) REFERENCES integration.connector_instances (id) ON DELETE CASCADE
)

;


CREATE TABLE IF NOT EXISTS integration.project_connector_bindings (
	id VARCHAR(64) NOT NULL, 
	project_id VARCHAR(64) NOT NULL, 
	connector_instance_id VARCHAR(64) NOT NULL, 
	is_enabled BOOLEAN NOT NULL, 
	custom_alias VARCHAR(128), 
	system_name VARCHAR(128) NOT NULL, 
	system_role VARCHAR(255), 
	use_platform_credentials BOOLEAN NOT NULL, 
	auth_override_json JSONB, 
	project_custom_fields_json JSONB, 
	project_filters_json JSONB, 
	notes TEXT, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	source_system VARCHAR(64) NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_project_system_name UNIQUE (project_id, system_name), 
	FOREIGN KEY(project_id) REFERENCES control_plane.projects (id) ON DELETE CASCADE, 
	FOREIGN KEY(connector_instance_id) REFERENCES integration.connector_instances (id) ON DELETE CASCADE
)

;


CREATE TABLE IF NOT EXISTS integration.project_tool_env_mappings (
	id VARCHAR(64) NOT NULL, 
	project_id VARCHAR(64) NOT NULL, 
	project_environment VARCHAR(64) NOT NULL, 
	connector_instance_id VARCHAR(64) NOT NULL, 
	tool_environment VARCHAR(64) NOT NULL, 
	is_active BOOLEAN NOT NULL, 
	notes TEXT, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	source_system VARCHAR(64) NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_proj_env_tool_mapping UNIQUE (project_id, project_environment, connector_instance_id), 
	FOREIGN KEY(project_id) REFERENCES control_plane.projects (id) ON DELETE CASCADE, 
	FOREIGN KEY(connector_instance_id) REFERENCES integration.connector_instances (id) ON DELETE CASCADE
)

;


CREATE TABLE IF NOT EXISTS runtime.messages (
	id VARCHAR(64) NOT NULL, 
	conversation_id VARCHAR(64) NOT NULL, 
	sender_type VARCHAR(32) NOT NULL, 
	content TEXT NOT NULL, 
	reasoning_text TEXT, 
	tool_calls_json JSONB, 
	attachments_json JSONB, 
	tokens_used INTEGER, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	source_system VARCHAR(64) NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(conversation_id) REFERENCES runtime.conversations (id) ON DELETE CASCADE
)

;


CREATE TABLE IF NOT EXISTS runtime.runs (
	id VARCHAR(64) NOT NULL, 
	conversation_id VARCHAR(64) NOT NULL, 
	project_id VARCHAR(64) NOT NULL, 
	environment VARCHAR(64) NOT NULL, 
	profile_id VARCHAR(64) NOT NULL, 
	status VARCHAR(32) NOT NULL, 
	model_route VARCHAR(128) NOT NULL, 
	started_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	completed_at TIMESTAMP WITH TIME ZONE, 
	total_tokens INTEGER, 
	latency_ms INTEGER, 
	error_message TEXT, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	source_system VARCHAR(64) NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(conversation_id) REFERENCES runtime.conversations (id) ON DELETE CASCADE, 
	FOREIGN KEY(project_id) REFERENCES control_plane.projects (id) ON DELETE CASCADE
)

;


CREATE TABLE IF NOT EXISTS audit_analytics.run_metrics (
	id VARCHAR(64) NOT NULL, 
	run_id VARCHAR(64) NOT NULL, 
	project_id VARCHAR(64) NOT NULL, 
	environment VARCHAR(64) NOT NULL, 
	time_to_first_token_ms INTEGER NOT NULL, 
	total_duration_ms INTEGER NOT NULL, 
	prompt_tokens INTEGER NOT NULL, 
	completion_tokens INTEGER NOT NULL, 
	tool_invocations_count INTEGER NOT NULL, 
	action_proposals_count INTEGER NOT NULL, 
	status VARCHAR(32) NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	source_system VARCHAR(64) NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(run_id) REFERENCES runtime.runs (id) ON DELETE CASCADE
)

;


CREATE TABLE IF NOT EXISTS runtime.action_proposals (
	id VARCHAR(64) NOT NULL, 
	run_id VARCHAR(64) NOT NULL, 
	connector_instance_id VARCHAR(64) NOT NULL, 
	tool_environment VARCHAR(64) NOT NULL, 
	operation VARCHAR(128) NOT NULL, 
	target_resource_json JSONB NOT NULL, 
	payload_json JSONB NOT NULL, 
	diff_preview TEXT, 
	risk_level VARCHAR(32) NOT NULL, 
	required_role VARCHAR(64) NOT NULL, 
	status VARCHAR(32) NOT NULL, 
	expires_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	canonical_hash VARCHAR(64) NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	source_system VARCHAR(64) NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(run_id) REFERENCES runtime.runs (id) ON DELETE CASCADE
)

;


CREATE TABLE IF NOT EXISTS runtime.coverage_reports (
	id VARCHAR(64) NOT NULL, 
	run_id VARCHAR(64) NOT NULL, 
	coverage_json JSONB NOT NULL, 
	gaps_json JSONB NOT NULL, 
	is_complete BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	source_system VARCHAR(64) NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (run_id), 
	FOREIGN KEY(run_id) REFERENCES runtime.runs (id) ON DELETE CASCADE
)

;


CREATE TABLE IF NOT EXISTS runtime.evidence_bundles (
	id VARCHAR(64) NOT NULL, 
	run_id VARCHAR(64) NOT NULL, 
	step_id VARCHAR(64), 
	connector_id VARCHAR(64) NOT NULL, 
	operation VARCHAR(128) NOT NULL, 
	observations_json JSONB NOT NULL, 
	produced_signals_json JSONB NOT NULL, 
	artifact_ref VARCHAR(255), 
	confidence_score DOUBLE PRECISION NOT NULL, 
	content_sha256 VARCHAR(64) NOT NULL, 
	summary TEXT NOT NULL, 
	raw_payload_json JSONB NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	source_system VARCHAR(64) NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(run_id) REFERENCES runtime.runs (id) ON DELETE CASCADE
)

;


CREATE TABLE IF NOT EXISTS runtime.evidence_items (
	id VARCHAR(64) NOT NULL, 
	run_id VARCHAR(64) NOT NULL, 
	source_system VARCHAR(64) NOT NULL, 
	connector_instance_id VARCHAR(64) NOT NULL, 
	tool_environment VARCHAR(64) NOT NULL, 
	operation VARCHAR(128) NOT NULL, 
	query_params_json JSONB NOT NULL, 
	raw_payload_json JSONB NOT NULL, 
	normalized_summary TEXT NOT NULL, 
	confidence_score DOUBLE PRECISION NOT NULL, 
	content_sha256 VARCHAR(64) NOT NULL, 
	is_redacted BOOLEAN NOT NULL, 
	relevance_rating VARCHAR(32), 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	PRIMARY KEY (id), 
	FOREIGN KEY(run_id) REFERENCES runtime.runs (id) ON DELETE CASCADE
)

;


CREATE TABLE IF NOT EXISTS runtime.execution_plans (
	id VARCHAR(64) NOT NULL, 
	run_id VARCHAR(64) NOT NULL, 
	objective TEXT NOT NULL, 
	waves_json JSONB NOT NULL, 
	status VARCHAR(32) NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	source_system VARCHAR(64) NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (run_id), 
	FOREIGN KEY(run_id) REFERENCES runtime.runs (id) ON DELETE CASCADE
)

;


CREATE TABLE IF NOT EXISTS runtime.model_invocations (
	id VARCHAR(64) NOT NULL, 
	run_id VARCHAR(64) NOT NULL, 
	stage VARCHAR(64) NOT NULL, 
	model_alias VARCHAR(64) NOT NULL, 
	resolved_model VARCHAR(128) NOT NULL, 
	prompt_tokens INTEGER NOT NULL, 
	completion_tokens INTEGER NOT NULL, 
	latency_ms INTEGER NOT NULL, 
	cost_usd DOUBLE PRECISION, 
	status VARCHAR(32) NOT NULL, 
	error_message TEXT, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	source_system VARCHAR(64) NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(run_id) REFERENCES runtime.runs (id) ON DELETE CASCADE
)

;


CREATE TABLE IF NOT EXISTS runtime.run_events (
	id VARCHAR(64) NOT NULL, 
	run_id VARCHAR(64) NOT NULL, 
	seq_no INTEGER NOT NULL, 
	event_type VARCHAR(64) NOT NULL, 
	payload_json JSONB NOT NULL, 
	occurred_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	source_system VARCHAR(64) NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(run_id) REFERENCES runtime.runs (id) ON DELETE CASCADE
)

;


CREATE TABLE IF NOT EXISTS runtime.run_snapshots (
	id VARCHAR(64) NOT NULL, 
	run_id VARCHAR(64) NOT NULL, 
	resolved_skills_json JSONB NOT NULL, 
	resolved_connectors_json JSONB NOT NULL, 
	resolved_parameters_json JSONB NOT NULL, 
	effective_env_mappings_json JSONB NOT NULL, 
	sha256_hash VARCHAR(64) NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	source_system VARCHAR(64) NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (run_id), 
	FOREIGN KEY(run_id) REFERENCES runtime.runs (id) ON DELETE CASCADE
)

;


CREATE TABLE IF NOT EXISTS runtime.tool_calls (
	id VARCHAR(64) NOT NULL, 
	run_id VARCHAR(64) NOT NULL, 
	connector_instance_id VARCHAR(64) NOT NULL, 
	tool_environment VARCHAR(64) NOT NULL, 
	operation VARCHAR(128) NOT NULL, 
	input_args_json JSONB NOT NULL, 
	output_data_json JSONB, 
	status VARCHAR(32) NOT NULL, 
	duration_ms INTEGER NOT NULL, 
	error_message TEXT, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	source_system VARCHAR(64) NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(run_id) REFERENCES runtime.runs (id) ON DELETE CASCADE
)

;


CREATE TABLE IF NOT EXISTS runtime.action_executions (
	id VARCHAR(64) NOT NULL, 
	proposal_id VARCHAR(64) NOT NULL, 
	approver_user_id VARCHAR(64) NOT NULL, 
	approval_decision VARCHAR(32) NOT NULL, 
	approver_notes TEXT, 
	delegated_identity VARCHAR(255) NOT NULL, 
	execution_status VARCHAR(32) NOT NULL, 
	external_ref VARCHAR(255), 
	result_payload_json JSONB, 
	executed_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	source_system VARCHAR(64) NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (proposal_id), 
	FOREIGN KEY(proposal_id) REFERENCES runtime.action_proposals (id) ON DELETE CASCADE, 
	FOREIGN KEY(approver_user_id) REFERENCES iam.users (id)
)

;


CREATE TABLE IF NOT EXISTS runtime.execution_steps (
	id VARCHAR(64) NOT NULL, 
	plan_id VARCHAR(64) NOT NULL, 
	step_id VARCHAR(64) NOT NULL, 
	wave_number INTEGER NOT NULL, 
	operation_key VARCHAR(128) NOT NULL, 
	capability VARCHAR(64) NOT NULL, 
	connector_instance_id VARCHAR(64) NOT NULL, 
	tool_environment VARCHAR(64) NOT NULL, 
	required_signals_json JSONB NOT NULL, 
	status VARCHAR(32) NOT NULL, 
	duration_ms INTEGER NOT NULL, 
	error_message TEXT, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	etl_job_id VARCHAR(64) NOT NULL, 
	sync_version BIGINT NOT NULL, 
	is_deleted BOOLEAN NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	row_hash VARCHAR(64), 
	source_system VARCHAR(64) NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(plan_id) REFERENCES runtime.execution_plans (id) ON DELETE CASCADE
)

;

