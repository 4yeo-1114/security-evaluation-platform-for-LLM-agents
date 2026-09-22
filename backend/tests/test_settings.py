"""配置与脱敏边界：密钥只能来自后端环境且不能进入日志。"""

from __future__ import annotations

import pytest

from agentsec.settings import Settings, redact_secrets


def test_settings_reads_deepseek_key_from_environment(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("DEEPSEEK_API_KEY", "local-test-key")
    monkeypatch.setenv("DEEPSEEK_MODEL", "deepseek-flash")
    settings = Settings.from_env()
    assert settings.deepseek_api_key == "local-test-key"
    assert settings.deepseek_model == "deepseek-flash"
    assert "local-test-key" not in repr(settings)


def test_missing_key_does_not_break_mock_mode(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("DEEPSEEK_API_KEY", raising=False)
    settings = Settings.from_env()
    assert settings.deepseek_api_key is None
    assert settings.provider_ready("mock")
    assert not settings.provider_ready("deepseek")


def test_redact_secrets_recurses_without_mutating_input() -> None:
    original = {
        "headers": {"Authorization": "Bearer local-test-key"},
        "api_key": "local-test-key",
        "events": [{"tool": "market_get_quote", "args": {"symbol": "AAPL"}}],
    }
    redacted = redact_secrets(original, known_secrets=("local-test-key",))
    assert redacted["api_key"] == "[REDACTED]"
    assert redacted["headers"]["Authorization"] == "[REDACTED]"
    assert redacted["events"][0]["args"]["symbol"] == "AAPL"
    assert original["api_key"] == "local-test-key"
    assert "local-test-key" not in str(redacted)


def test_redact_secrets_handles_provider_key_names_and_embedded_values() -> None:
    event = {
        "deepseek_api_key": "provider-key",
        "headers": {"Proxy-Authorization": "Bearer provider-key"},
        "message": "request failed with provider-key",
        "token_count": 42,
    }
    result = redact_secrets(event, known_secrets=("provider-key",))
    assert result["deepseek_api_key"] == "[REDACTED]"
    assert result["headers"]["Proxy-Authorization"] == "[REDACTED]"
    assert result["message"] == "request failed with [REDACTED]"
    assert result["token_count"] == 42
