"""后端环境配置与日志/事件脱敏。"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import Any


@dataclass(frozen=True)
class Settings:
    # repr=False 防止调试打印配置时泄漏密钥。
    deepseek_api_key: str | None = field(default=None, repr=False)
    deepseek_model: str = "deepseek-flash"
    deepseek_judge_model: str = "deepseek-flash"

    @classmethod
    def from_env(cls) -> Settings:
        """仅后端读取密钥；前端和 Case 文件不保存密钥。"""
        return cls(
            deepseek_api_key=os.getenv("DEEPSEEK_API_KEY") or None,
            deepseek_model=os.getenv("DEEPSEEK_MODEL", "deepseek-flash"),
            deepseek_judge_model=os.getenv("DEEPSEEK_JUDGE_MODEL", "deepseek-flash"),
        )

    def provider_ready(self, provider: str) -> bool:
        if provider == "mock":
            return True
        if provider == "deepseek":
            return bool(self.deepseek_api_key)
        return False


_SENSITIVE_KEYS = {"api_key", "apikey", "authorization", "token", "password", "secret"}


def _is_sensitive_key(key: object) -> bool:
    """匹配常见凭据字段，但保留 token_count 等普通统计字段。"""
    name = str(key).lower().replace("-", "_")
    return name in _SENSITIVE_KEYS or name.endswith(
        ("_api_key", "_token", "_authorization", "_password", "_secret")
    )


def redact_secrets(value: Any, *, known_secrets: tuple[str, ...] = ()) -> Any:
    """复制并递归遮盖敏感字段；原对象保持不变。"""
    if isinstance(value, dict):
        return {
            key: "[REDACTED]" if _is_sensitive_key(key)
            else redact_secrets(item, known_secrets=known_secrets)
            for key, item in value.items()
        }
    if isinstance(value, list):
        return [redact_secrets(item, known_secrets=known_secrets) for item in value]
    if isinstance(value, tuple):
        return tuple(redact_secrets(item, known_secrets=known_secrets) for item in value)
    if isinstance(value, str):
        for secret in known_secrets:
            if secret:
                value = value.replace(secret, "[REDACTED]")
    return value
