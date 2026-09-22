"""评测 Case 与 Suite 的输入合同；这里只校验数据，不执行 Case 文本。"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class StrictSpec(BaseModel):
    # 拼错字段立刻报错，冻结对象以防运行期间修改评测定义。
    model_config = ConfigDict(extra="forbid", frozen=True, str_strip_whitespace=True)


class PrincipalSpec(StrictSpec):
    """请求主体和被授予的权限。"""

    principal_id: str = Field(min_length=1)
    tenant_id: str = Field(min_length=1)
    role: str = Field(min_length=1)
    permissions: tuple[str, ...] = ()


class ResourceSpec(StrictSpec):
    """Agent 访问的业务对象；租户和可见性供策略检查使用。"""

    resource_id: str = Field(min_length=1)
    resource_type: str = Field(min_length=1)
    tenant_id: str = Field(min_length=1)
    owner_id: str | None = None
    visibility: Literal["public", "tenant", "private"]


class EnvironmentSpec(StrictSpec):
    """固定夹具和随机种子，让同一 Case 尽可能可复现。"""

    fixture_id: str = Field(min_length=1)
    seed: int = Field(ge=0)


class ExpectedSpec(StrictSpec):
    """裁判读取的预期结果，不提供给被测 Agent。"""

    status: Literal["completed", "denied", "stopped"]
    allowed_tools: tuple[str, ...] = ()
    forbidden_tools: tuple[str, ...] = ()
    required_policy_codes: tuple[str, ...] = ()
    allowed_state_changes: tuple[str, ...] = ()
    judge_rubric: tuple[str, ...] = ()


class CaseSpec(StrictSpec):
    """单个正常任务或攻击场景的完整描述。"""

    id: str = Field(pattern=r"^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$")
    title: str = Field(min_length=1)
    version: Literal[1] = 1
    kind: Literal["normal", "attack"]
    risk_category: Literal[
        "input_boundary", "tool_misuse", "data_exfiltration", "permission_boundary",
        "memory_poisoning", "rag_injection", "workflow_hijack", "approval_bypass",
    ] | None = None
    severity: Literal["low", "medium", "high", "critical"]
    language: Literal["zh", "en"] = "zh"
    tags: tuple[str, ...] = ()
    quick: bool = False
    principal: PrincipalSpec
    resource: ResourceSpec
    environment: EnvironmentSpec
    prompt: str = Field(min_length=1)
    attack_surface: Literal[
        "none", "direct_prompt", "retrieved_document", "memory",
        "tool_description", "tool_response",
    ] = "none"
    attack_payload: str | None = None
    available_tools: tuple[str, ...] = ()
    approval: Literal["auto_approve", "auto_deny", "manual"] = "auto_deny"
    expected: ExpectedSpec

    @model_validator(mode="after")
    def validate_attack_shape(self) -> CaseSpec:
        # 攻击样例必须声明入口和内容，否则无效样例可能被误算为防御成功。
        if self.kind == "attack" and (
            self.risk_category is None or self.attack_surface == "none"
            or not (self.attack_payload or "").strip()
        ):
            raise ValueError("攻击 Case 必须提供风险类别、攻击入口和非空负载")
        if self.kind == "normal" and (
            self.attack_surface != "none" or self.attack_payload is not None
        ):
            raise ValueError("正常 Case 不应包含攻击入口或攻击负载")
        return self


class SuiteSpec(StrictSpec):
    """一组能按 ID 稳定引用的 Case。"""

    schema_version: Literal[1] = 1
    suite_id: str = Field(pattern=r"^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$")
    title: str = Field(min_length=1)
    domain: str = Field(min_length=1)
    cases: tuple[CaseSpec, ...] = Field(min_length=1)

    @model_validator(mode="after")
    def unique_case_ids(self) -> SuiteSpec:
        ids = [case.id for case in self.cases]
        if len(ids) != len(set(ids)):
            raise ValueError("Suite 中存在重复的 Case ID")
        return self
