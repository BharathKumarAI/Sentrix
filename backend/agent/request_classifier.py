"""
4-Dimensional Chat Request Classifier & Envelope Engine for Sentrix.
Decomposes every inbound chat request along 4 orthogonal dimensions:
1. Intent (16 canonical types + CONTINUE)
2. Scope (project, environment, entities: BAN, Order ID, Ticket ID, user)
3. Execution Mode (Read-Only vs. Mutation/Write with Delegated Identity)
4. Risk Tier (LOW, MEDIUM, HIGH, CRITICAL with Approval Policy)

Prevents treating investigations as isolated single-tool commands, enabling unified
cross-tool autonomous workflows.
"""
import enum
import logging
import re
import uuid
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from backend.auth.identity import seeded_admin_user_id

logger = logging.getLogger("sentrix.agent.classifier")


class IntentType(str, enum.Enum):
    ASK = "ASK"
    SEARCH = "SEARCH"
    LOOKUP = "LOOKUP"
    INVESTIGATE = "INVESTIGATE"
    ANALYZE = "ANALYZE"
    COMPARE = "COMPARE"
    SUMMARIZE = "SUMMARIZE"
    EXPLAIN = "EXPLAIN"
    GENERATE = "GENERATE"
    PLAN = "PLAN"
    EXECUTE = "EXECUTE"
    CHANGE = "CHANGE"
    APPROVE = "APPROVE"
    ADMINISTER = "ADMINISTER"
    CREATE_WORKFLOW = "CREATE_WORKFLOW"
    CONVERSE = "CONVERSE"
    CONTINUE = "CONTINUE"


class RiskTier(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


@dataclass
class ExtractedEntity:
    type: str
    value: str
    source: str = "prompt"
    confidence: float = 0.95


@dataclass
class RequestIntent:
    type: IntentType
    subtype: str
    confidence: float = 0.95


@dataclass
class RequestScope:
    project_id: str
    environment: str
    user_id: Optional[str] = None
    session_id: Optional[str] = None


@dataclass
class RequestExecution:
    mode: str  # "read_only" | "mutation" | "agentic" | "workflow"
    allow_reads: bool = True
    allow_writes: bool = False
    requires_preview: bool = False


@dataclass
class RequestRisk:
    tier: RiskTier
    approval_required: bool = False
    reversible: bool = True
    policy_name: str = "DEFAULT_GOVERNANCE"


@dataclass
class RequestContext:
    continuation_of: Optional[str] = None
    parent_request_id: Optional[str] = None
    conversation_id: Optional[str] = None


@dataclass
class ChatRequestEnvelope:
    request_id: str
    timestamp: str
    intent: RequestIntent
    scope: RequestScope
    entities: List[ExtractedEntity]
    execution: RequestExecution
    risk: RequestRisk
    context: RequestContext
    raw_prompt: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "request_id": self.request_id,
            "timestamp": self.timestamp,
            "intent": {
                "type": self.intent.type.value,
                "subtype": self.intent.subtype,
                "confidence": self.intent.confidence,
            },
            "scope": asdict(self.scope),
            "entities": [asdict(e) for e in self.entities],
            "execution": asdict(self.execution),
            "risk": {
                "tier": self.risk.tier.value,
                "approval_required": self.risk.approval_required,
                "reversible": self.risk.reversible,
                "policy_name": self.risk.policy_name,
            },
            "context": asdict(self.context),
            "raw_prompt": self.raw_prompt,
        }


class RequestClassifier:
    """
    Parses natural language prompts and context into the Sentrix 4-Dimensional Request Envelope.
    """

    # Entity Regexes
    BAN_REGEX = re.compile(r"\b(?:BAN|ban|account)[\s:]*([0-9]{8,12})\b|\b([0-9]{9})\b")
    ORDER_REGEX = re.compile(r"\b(?:order|order_id|Order)[\s:]*([0-9]{10,14})\b")
    JIRA_REGEX = re.compile(r"\b([A-Z]{2,10}-[0-9]{1,6})\b")
    ENV_REGEX = re.compile(r"\b(QLAB0[1-9]|PROD|STAGING|DEV|TEST|QA|UAT)\b", re.IGNORECASE)

    # Keywords for Read vs Write
    APPROVAL_KEYWORDS = ["approve", "approved", "confirm", "proceed", "reject", "cancel"]
    MUTATION_KEYWORDS = [
        "add comment", "post comment", "assign", "transition", "restart",
        "restart pod", "remediate", "update record", "delete", "create ticket",
        "trigger deploy", "kill pod", "modify", "patch"
    ]
    GENERATE_KEYWORDS = ["generate sql", "write query", "draft comment", "create rca", "draft rca", "propose plan"]
    SEARCH_KEYWORDS = ["find all", "search", "list all issues", "look for", "query all"]
    LOOKUP_KEYWORDS = ["get ticket", "fetch ticket", "show issue", "get stdp", "lookup"]
    COMPARE_KEYWORDS = ["compare", "difference between", "diff", "versus", "vs"]
    EXPLAIN_KEYWORDS = ["explain", "what does", "why is", "how does", "interpret"]
    SUMMARIZE_KEYWORDS = ["summarize", "give me a summary", "condense", "overview of"]
    CONTINUATION_KEYWORDS = ["also", "and also", "check qlab", "what about", "go deeper", "check logs too", "post it"]

    @classmethod
    def extract_entities(cls, text: str) -> List[ExtractedEntity]:
        entities: List[ExtractedEntity] = []

        # Extract BAN
        ban_matches = cls.BAN_REGEX.findall(text)
        for m in ban_matches:
            val = m[0] if m[0] else m[1]
            if val and len(val) >= 8:
                entities.append(ExtractedEntity(type="account.id", value=val, source="prompt"))
                break

        # Extract Order ID
        order_matches = cls.ORDER_REGEX.findall(text)
        for val in order_matches:
            if val:
                entities.append(ExtractedEntity(type="order.id", value=val, source="prompt"))
                break

        # Extract Jira ticket keys
        jira_matches = cls.JIRA_REGEX.findall(text)
        for val in jira_matches:
            entities.append(ExtractedEntity(type="ticket.key", value=val, source="prompt"))

        return entities

    @classmethod
    def resolve_environment(cls, text: str, default_env: str = "") -> str:
        m = cls.ENV_REGEX.search(text)
        if m:
            return m.group(1).upper()
        return default_env

    @classmethod
    def classify(
        cls,
        prompt: str,
        project_id: str = "",
        environment: Optional[str] = None,
        user_id: Optional[str] = None,
        conversation_id: Optional[str] = None,
        parent_request_id: Optional[str] = None,
        is_continuation: bool = False,
    ) -> ChatRequestEnvelope:
        clean_text = prompt.strip()
        lower = clean_text.lower()
        request_id = f"req_{uuid.uuid4().hex[:8]}"
        resolved_env = cls.resolve_environment(clean_text, default_env=environment or "")
        entities = cls.extract_entities(clean_text)

        # 1. Detect Intent
        intent_type = IntentType.INVESTIGATE
        subtype = "GENERAL_INVESTIGATION"
        confidence = 0.95

        # Check Approval Intent
        if any(lower.startswith(k) for k in cls.APPROVAL_KEYWORDS):
            intent_type = IntentType.APPROVE
            subtype = "ACTION_DECISION"
            confidence = 0.99

        # Check Continuation Intent
        elif is_continuation or (parent_request_id and any(k in lower for k in cls.CONTINUATION_KEYWORDS)):
            intent_type = IntentType.CONTINUE
            subtype = "FOLLOW_UP_SCOPE_EXPANSION"
            confidence = 0.96

        # Check Mutation / Action Execution
        elif any(k in lower for k in cls.MUTATION_KEYWORDS):
            intent_type = IntentType.EXECUTE
            subtype = "MUTATION_ACTION"
            confidence = 0.97

        # Check Generation
        elif any(k in lower for k in cls.GENERATE_KEYWORDS):
            intent_type = IntentType.GENERATE
            subtype = "CONTENT_SYNTHESIS"
            confidence = 0.92

        # Check Compare
        elif any(k in lower for k in cls.COMPARE_KEYWORDS):
            intent_type = IntentType.COMPARE
            subtype = "ENVIRONMENT_DIFF"
            confidence = 0.94

        # Check Summarize
        elif any(k in lower for k in cls.SUMMARIZE_KEYWORDS):
            intent_type = IntentType.SUMMARIZE
            subtype = "ISSUE_SUMMARY"
            confidence = 0.93

        # Check Explain
        elif any(k in lower for k in cls.EXPLAIN_KEYWORDS):
            intent_type = IntentType.EXPLAIN
            subtype = "SYSTEM_REASONING"
            confidence = 0.91

        # Check Lookup (deterministic single entity)
        elif len(entities) == 1 and any(k in lower for k in cls.LOOKUP_KEYWORDS):
            intent_type = IntentType.LOOKUP
            subtype = "DETERMINISTIC_FETCH"
            confidence = 0.96

        # Check Search
        elif any(k in lower for k in cls.SEARCH_KEYWORDS):
            intent_type = IntentType.SEARCH
            subtype = "MULTI_SOURCE_QUERY"
            confidence = 0.90

        # Billing or Root Cause Investigation
        elif "why did" in lower or "failed" in lower or "investigate" in lower or "root cause" in lower:
            intent_type = IntentType.INVESTIGATE
            subtype = "ROOT_CAUSE_ANALYSIS"
            confidence = 0.98

        # 2. Determine Execution Mode & Read/Write Separation
        is_write = intent_type in (IntentType.EXECUTE, IntentType.CHANGE) or any(k in lower for k in cls.MUTATION_KEYWORDS)
        
        if is_write:
            exec_mode = "mutation"
            allow_reads = True
            allow_writes = True
            requires_preview = True
        elif intent_type == IntentType.INVESTIGATE:
            exec_mode = "agentic"
            allow_reads = True
            allow_writes = False
            requires_preview = False
        else:
            exec_mode = "read_only"
            allow_reads = True
            allow_writes = False
            requires_preview = False

        # 3. Determine Risk Tier & Governance
        if "restart" in lower or "kill" in lower or "delete" in lower or "prod" in resolved_env:
            risk_tier = RiskTier.HIGH if is_write else RiskTier.LOW
            approval_req = is_write
        elif is_write:
            risk_tier = RiskTier.MEDIUM
            approval_req = True
        else:
            risk_tier = RiskTier.LOW
            approval_req = False

        scope = RequestScope(
            project_id=project_id,
            environment=resolved_env,
            user_id=user_id or seeded_admin_user_id(),
            session_id=conversation_id,
        )

        risk = RequestRisk(
            tier=risk_tier,
            approval_required=approval_req,
            reversible=not ("delete" in lower or "kill" in lower),
            policy_name="SENTRIX_DELEGATED_GOVERNANCE"
        )

        execution = RequestExecution(
            mode=exec_mode,
            allow_reads=allow_reads,
            allow_writes=allow_writes,
            requires_preview=requires_preview
        )

        context = RequestContext(
            continuation_of=parent_request_id if intent_type == IntentType.CONTINUE else None,
            parent_request_id=parent_request_id,
            conversation_id=conversation_id
        )

        envelope = ChatRequestEnvelope(
            request_id=request_id,
            timestamp=datetime.now(timezone.utc).isoformat(),
            intent=RequestIntent(type=intent_type, subtype=subtype, confidence=confidence),
            scope=scope,
            entities=entities,
            execution=execution,
            risk=risk,
            context=context,
            raw_prompt=clean_text
        )

        logger.info(
            f"[Classifier] Request {request_id}: Intent={intent_type.value}/{subtype}, "
            f"Scope={project_id}/{resolved_env}, Mode={exec_mode}, Risk={risk_tier.value}, Approval={approval_req}"
        )
        return envelope
