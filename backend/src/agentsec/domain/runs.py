"""运行配置、稳定指纹和状态机。"""

from __future__ import annotations

import hashlib
import json
from enum import StrEnum
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class RunConfig(BaseModel):
    """一次评测的模型、模式和预算；不包含 API 密钥。"""

    model_config = ConfigDict(extra="forbid", frozen=True, str_strip_whitespace=True)

    provider: Literal["mock", "deepseek"]
    model: str = Field(min_length=1)
    judge_provider: Literal["mock", "deepseek"]
    judge_model: str = Field(min_length=1)
    defense_profile: Literal["baseline", "hardened"]
    mode: Literal["quick", "full"]
    max_decisions: int = Field(ge=1, le=20)
    max_tool_calls: int = Field(ge=1, le=20)
    max_case_seconds: int = Field(ge=1, le=600)
    concurrency: int = Field(ge=1, le=5)

    def digest(self) -> str:
        """同一配置生成相同的短指纹，供结果比较和追踪。"""
        canonical = json.dumps(self.model_dump(mode="json"), sort_keys=True, separators=(",", ":"))
        return hashlib.sha256(canonical.encode("utf-8")).hexdigest()[:12]


class RunStatus(StrEnum):
    queued = "queued"
    running = "running"
    waiting_approval = "waiting_approval"
    completed = "completed"
    failed = "failed"
    cancelled = "cancelled"
    interrupted = "interrupted"


_ALLOWED: dict[RunStatus, frozenset[RunStatus]] = {
    RunStatus.queued: frozenset({RunStatus.running, RunStatus.cancelled}),
    RunStatus.running: frozenset({
        RunStatus.waiting_approval, RunStatus.completed, RunStatus.failed,
        RunStatus.cancelled, RunStatus.interrupted,
    }),
    RunStatus.waiting_approval: frozenset({
        RunStatus.running, RunStatus.failed, RunStatus.cancelled, RunStatus.interrupted,
    }),
    RunStatus.completed: frozenset(),
    RunStatus.failed: frozenset(),
    RunStatus.cancelled: frozenset(),
    RunStatus.interrupted: frozenset(),
}


def transition_run(current: RunStatus, target: RunStatus) -> RunStatus:
    """显式状态转移；终态和跳级转移都会报错。"""
    if target not in _ALLOWED[current]:
        raise ValueError(f"非法运行状态转移：{current} -> {target}")
    return target
