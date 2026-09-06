"""Extensible RCA methodology registry. Evaluators must supply evidence-based results."""
from enum import Enum
from typing import Any, Dict, List

class RCAMethodology(str, Enum):
    FIVE_WHYS = "five_whys"
    FISHBONE = "fishbone"
    KEPNER_TREGOE = "kepner_tregoe"
    FMEA = "fmea"
    FAULT_TREE = "fault_tree"
    AUTO_ENSEMBLE = "auto_ensemble"

class RCAEngine:
    _evaluators = {}

    @classmethod
    def register(cls, methodology, evaluator):
        cls._evaluators[RCAMethodology(methodology)] = evaluator

    @classmethod
    def get_catalog(cls) -> List[Dict[str, Any]]:
        return [
            {
                "methodology": RCAMethodology.FIVE_WHYS.value,
                "name": "The 5 Whys (Iterative Causal Tree)",
                "best_suited_for": "Fast-moving operational incidents, straightforward IT outages, and P1/P2 call stack drill-down.",
                "complexity": "LOW",
                "output_type": "Linear causal chain with evidence links per iteration."
            },
            {
                "methodology": RCAMethodology.FISHBONE.value,
                "name": "Ishikawa Fishbone Diagram (4Ss / 6Ms)",
                "best_suited_for": "Complex, recurring system degradations with multi-variable contributing factors across Systems, Policies, Processes, and Skills.",
                "complexity": "MEDIUM",
                "output_type": "Multi-category causal attribution skeleton with impact scores."
            },
            {
                "methodology": RCAMethodology.KEPNER_TREGOE.value,
                "name": "Kepner-Tregoe (KT) IS / IS NOT Matrix",
                "best_suited_for": "Environment-specific discrepancies and hardware/configuration drift isolation.",
                "complexity": "MEDIUM",
                "output_type": "4-dimensional differential table (What, Where, When, Extent) isolating the exact delta."
            },
            {
                "methodology": RCAMethodology.FMEA.value,
                "name": "Failure Mode & Effects Analysis (FMEA)",
                "best_suited_for": "Preventative reliability engineering, architecture review, and prioritizing engineering redesign backlogs by Risk Priority Number (RPN).",
                "complexity": "HIGH",
                "output_type": "RPN matrix (Severity x Occurrence x Detection) with critical threshold actions."
            },
            {
                "methodology": RCAMethodology.FAULT_TREE.value,
                "name": "Fault Tree Analysis (FTA - Boolean Logic)",
                "best_suited_for": "High-consequence catastrophic failures requiring concurrent multiple conditions (AND / OR gates) to breach safety barriers.",
                "complexity": "HIGH",
                "output_type": "Deductive tree with verified TRUE / FALSE condition branch states."
            },
            {
                "methodology": RCAMethodology.AUTO_ENSEMBLE.value,
                "name": "Auto-Ensemble (SRE Synthesis)",
                "best_suited_for": "Comprehensive executive post-mortems combining 5 Whys drill-down, Kepner-Tregoe environmental diff, and FMEA risk rating.",
                "complexity": "HIGH",
                "output_type": "Multi-methodology composite report with unified root cause isolation."
            }
        ]

    @classmethod
    def analyze(cls, incident_title, methodology=RCAMethodology.AUTO_ENSEMBLE,
                context=None, target_env=None, baseline_env=None):
        evaluator = cls._evaluators.get(RCAMethodology(methodology))
        if evaluator is None:
            raise ValueError("Configure an evidence-based evaluator for the selected RCA methodology.")
        if not context:
            raise ValueError("Supply evidence context before running root cause analysis.")
        return evaluator(incident_title=incident_title, context=context,
                         target_env=target_env, baseline_env=baseline_env)
