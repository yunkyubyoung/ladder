import { useState } from "react";
import { EMPTY_ADMIN_MATCH, loadAdminMatch, saveAdminMatch } from "./adminMatch";
import "./admin.css";

export function AdminPage() {
  const [config, setConfig] = useState(loadAdminMatch);
  const [message, setMessage] = useState("");

  const save = () => {
    const next = {
      enabled: config.enabled,
      topItem: config.topItem.trim(),
      bottomItem: config.bottomItem.trim(),
    };
    if (next.enabled && (!next.topItem || !next.bottomItem)) {
      setMessage("상단 항목과 하단 항목을 모두 입력해 주세요.");
      return;
    }
    saveAdminMatch(next);
    setConfig(next);
    setMessage(next.enabled ? "매칭 설정을 저장했습니다." : "강제 매칭을 사용하지 않습니다.");
  };

  const clear = () => {
    saveAdminMatch(EMPTY_ADMIN_MATCH);
    setConfig(EMPTY_ADMIN_MATCH);
    setMessage("설정을 초기화했습니다.");
  };

  return (
    <main className="admin-page">
      <section className="admin-card">
        <p className="admin-eyebrow">LADDER GAME</p>
        <h1>사다리 매칭 관리</h1>
        <p className="admin-description">
          게임 화면에 입력할 상단 항목과 하단 항목을 정확히 적으면, 사다리 시작 시 두 항목이 연결되도록 생성됩니다.
        </p>

        <label className="admin-toggle">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(event) => setConfig((current) => ({ ...current, enabled: event.target.checked }))}
          />
          <span>관리자 지정 매칭 사용</span>
        </label>

        <div className="admin-fields">
          <label>
            <span>사다리 상단 항목</span>
            <input
              value={config.topItem}
              onChange={(event) => setConfig((current) => ({ ...current, topItem: event.target.value }))}
              placeholder="예: 홍길동"
              maxLength={10}
            />
          </label>
          <div className="admin-arrow" aria-hidden="true">→</div>
          <label>
            <span>사다리 하단 항목</span>
            <input
              value={config.bottomItem}
              onChange={(event) => setConfig((current) => ({ ...current, bottomItem: event.target.value }))}
              placeholder="예: 당첨"
              maxLength={12}
            />
          </label>
        </div>

        <p className="admin-note">동일한 항목이 여러 개면 왼쪽에서 첫 번째 항목을 기준으로 적용됩니다.</p>
        {message && <p className="admin-message" role="status">{message}</p>}

        <div className="admin-actions">
          <button type="button" className="admin-secondary" onClick={clear}>초기화</button>
          <button type="button" className="admin-primary" onClick={save}>설정 저장</button>
        </div>
        <a className="admin-home-link" href="/">사다리 게임으로 돌아가기</a>
      </section>
    </main>
  );
}
