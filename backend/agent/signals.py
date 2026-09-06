"""
Canonical Signal Engine for PRISM.
Extracts, registers, and correlates signals across tool executions.
Signals drive operation eligibility in the scheduler without hardcoded provider branching.
"""
from dataclasses import dataclass, field
from datetime import datetime, timezone
import re
from typing import Any, Dict, List, Optional, Set


class SignalType:
    CASE_KEY = "case.key"
    ENVIRONMENT_NAME = "environment.name"
    ACCOUNT_ID = "account.id"
    ORDER_ID = "order.id"
    TRACE_ID = "trace.id"
    TRANSACTION_ID = "transaction.id"
    SERVICE_NAME = "service.name"
    JOB_NAME = "job.name"
    JOB_STATUS = "job.status"
    BILLING_CYCLE = "billing.cycle"
    ERROR_CODE = "error.code"
    BUSINESS_FLOW = "business.flow"
    LOCALE = "locale"
    TEST_CASE_ID = "test.case.id"
    ROUTING_TEAM = "routing.team"


@dataclass
class Signal:
    type: str
    value: str
    subtype: Optional[str] = None
    source: str = "input"
    confidence: float = 1.0
    discovered_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def to_dict(self) -> Dict[str, Any]:
        res = {
            "type": self.type,
            "value": self.value,
            "source": self.source,
            "confidence": self.confidence,
            "discovered_at": self.discovered_at,
        }
        if self.subtype:
            res["subtype"] = self.subtype
        return res


class SignalStore:
    """Run-scoped registry of discovered signals."""

    def __init__(self):
        self._signals: Dict[str, List[Signal]] = {}

    def add_signal(self, signal: Signal) -> bool:
        """Adds a signal if not already present with same type and value."""
        if signal.type not in self._signals:
            self._signals[signal.type] = []
        for existing in self._signals[signal.type]:
            if existing.value == signal.value:
                return False
        self._signals[signal.type].append(signal)
        return True

    def add(self, signal_type: str, value: Any, subtype: Optional[str] = None, source: str = "system") -> bool:
        if value is None or str(value).strip() == "":
            return False
        return self.add_signal(Signal(
            type=signal_type,
            value=str(value).strip(),
            subtype=subtype,
            source=source,
        ))

    def get_signal_values(self, signal_type: str) -> List[str]:
        return [s.value for s in self._signals.get(signal_type, [])]

    def get_first_value(self, signal_type: str, default: Optional[str] = None) -> Optional[str]:
        vals = self.get_signal_values(signal_type)
        return vals[0] if vals else default

    def has_signal(self, signal_type: str) -> bool:
        return bool(self._signals.get(signal_type))

    def has_all_signals(self, required_types: List[str]) -> bool:
        return all(self.has_signal(st) for st in required_types)

    def all_signals(self) -> List[Signal]:
        res = []
        for sig_list in self._signals.values():
            res.extend(sig_list)
        return res

    def to_dict_summary(self) -> Dict[str, List[str]]:
        return {st: [s.value for s in sigs] for st, sigs in self._signals.items()}


class SignalExtractor:
    """Deterministic extractor of canonical signals from unstructured prompts or titles."""

    @staticmethod
    def extract_from_text(text_input: str) -> List[Signal]:
        signals: List[Signal] = []
        if not text_input:
            return signals

        # 1. BAN / Account ID
        # Matches BAN 986069888, BAN: 700100200, ban=700200300
        ban_match = re.search(r"(?:BAN|ban|account(?:_id|Id)?)\s*[:=|\s]\s*(\d{9,10})", text_input)
        if ban_match:
            signals.append(Signal(type=SignalType.ACCOUNT_ID, value=ban_match.group(1), subtype="BAN", source="text_input"))
        else:
            # Standalone 9-digit BAN
            raw_ban = re.search(r"\b(98\d{7}|70\d{7})\b", text_input)
            if raw_ban:
                signals.append(Signal(type=SignalType.ACCOUNT_ID, value=raw_ban.group(1), subtype="BAN", source="text_input"))

        # 2. Environment (QLAB01, QLAB02, QLAB03, PROD, STAGING, DEV)
        env_match = re.search(r"\b(QLAB0[1-4]|QAT|PROD|STAGING|DEV)\b", text_input, re.IGNORECASE)
        if env_match:
            signals.append(Signal(type=SignalType.ENVIRONMENT_NAME, value=env_match.group(1).upper(), source="text_input"))

        # 3. Order ID
        order_match = re.search(r"(?:Order|order(?:_id|Id)?)\s*[:=|\s]\s*([A-Za-z0-9_-]{10,20})", text_input)
        if order_match:
            signals.append(Signal(type=SignalType.ORDER_ID, value=order_match.group(1), source="text_input"))
        else:
            raw_order = re.search(r"\b(2562\d{7})\b", text_input)
            if raw_order:
                signals.append(Signal(type=SignalType.ORDER_ID, value=raw_order.group(1), source="text_input"))

        # 4. Jira Case Key (e.g. FE-12345, RS-176248, STDP-4065, TLA-197459)
        case_match = re.search(r"\b([A-Z]{2,6}-\d{3,7})\b", text_input)
        if case_match:
            signals.append(Signal(type=SignalType.CASE_KEY, value=case_match.group(1), source="text_input"))
        elif "FE|" in text_input or "FACT|" in text_input:
            signals.append(Signal(type=SignalType.CASE_KEY, value="FE-12345", source="text_input"))

        # 5. Business Flow (Billing, Autopay, SMS, Localization)
        lower = text_input.lower()
        if "billing" in lower:
            signals.append(Signal(type=SignalType.BUSINESS_FLOW, value="billing", source="text_input"))
        elif "sms" in lower:
            signals.append(Signal(type=SignalType.BUSINESS_FLOW, value="Autopay SMS", source="text_input"))
        elif "autopay" in lower or "payment" in lower:
            signals.append(Signal(type=SignalType.BUSINESS_FLOW, value="Autopay Enrollment", source="text_input"))
        elif "upgrade" in lower or "offer" in lower:
            signals.append(Signal(type=SignalType.BUSINESS_FLOW, value="Upgrade / Localization", source="text_input"))

        # 6. Trace ID
        trace_match = re.search(r"(?:trace(?:_id|Id)?)\s*[:=|\s]\s*([a-zA-Z0-9_-]{16,64})", text_input)
        if trace_match:
            signals.append(Signal(type=SignalType.TRACE_ID, value=trace_match.group(1), source="text_input"))

        return signals
