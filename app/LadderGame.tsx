"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { loadAdminMatch } from "./adminMatch";

type Bar = { row: number; col: number; tilt: number };
type Point = { x: number; y: number };

const COLORS = ["#f04444", "#3977e8", "#16a06b", "#f19a25", "#865bd5", "#e55da2", "#1b9aaa", "#78533f"];
const DEFAULT_NAMES = ["", "", "", "", "", ""];
const DEFAULT_RESULTS = ["", "", "", "", "", ""];

function makeBars(count: number): Bar[] {
  const rows = Math.max(10, count * 2 + 2);
  const bars: Bar[] = [];
  for (let row = 0; row < rows; row++) {
    const col = Math.floor(Math.random() * (count - 1));
    bars.push({ row, col, tilt: 0 });
    if (count > 4 && Math.random() > 0.52) {
      const candidates = Array.from({ length: count - 1 }, (_, i) => i).filter((i) => Math.abs(i - col) > 1);
      if (candidates.length) bars.push({ row, col: candidates[Math.floor(Math.random() * candidates.length)], tilt: 0 });
    }
  }

  const diagonalCount = Math.min(bars.length, Math.random() < 0.5 ? 1 : 2);
  const rowGap = 460 / (rows + 1);
  const maxTilt = Math.min(24, rowGap * 0.8);
  const candidates = bars.map((_, index) => index).sort(() => Math.random() - 0.5);
  const selectedRows = new Set<number>();
  for (const index of candidates) {
    if (selectedRows.has(bars[index].row)) continue;
    const direction = Math.random() < 0.5 ? -1 : 1;
    bars[index].tilt = direction * maxTilt;
    selectedRows.add(bars[index].row);
    if (selectedRows.size === diagonalCount) break;
  }

  return bars;
}

function tracePath(start: number, count: number, bars: Bar[], width = 1000, height = 560) {
  const padX = 0;
  const topY = 50;
  const bottomY = height - 50;
  const gap = width / (count - 1);
  const rows = Math.max(...bars.map((bar) => bar.row), 0) + 1;
  const rowGap = (bottomY - topY) / (rows + 1);
  const points: Point[] = [{ x: padX + start * gap, y: topY }];
  let current = start;
  for (let row = 0; row < rows; row++) {
    const y = topY + (row + 1) * rowGap;
    const right = bars.find((bar) => bar.row === row && bar.col === current);
    const left = bars.find((bar) => bar.row === row && bar.col === current - 1);
    if (right) {
      points.push({ x: padX + current * gap, y: y - right.tilt });
      current += 1;
      points.push({ x: padX + current * gap, y: y + right.tilt });
    } else if (left) {
      points.push({ x: padX + current * gap, y: y + left.tilt });
      current -= 1;
      points.push({ x: padX + current * gap, y: y - left.tilt });
    } else {
      points.push({ x: padX + current * gap, y });
    }
  }
  points.push({ x: padX + current * gap, y: bottomY });
  return { points, end: current };
}

function makeBarsWithAdminMatch(count: number, topIndex: number, bottomIndex: number) {
  let bars = makeBars(count);
  for (let attempt = 0; attempt < 500; attempt++) {
    if (tracePath(topIndex, count, bars).end === bottomIndex) return bars;
    bars = makeBars(count);
  }
  return bars;
}

function normalize(items: string[], count: number, fallback: (i: number) => string) {
  return Array.from({ length: count }, (_, i) => items[i] ?? fallback(i));
}

export function LadderGame() {
  const [count, setCount] = useState(6);
  const [names, setNames] = useState(DEFAULT_NAMES);
  const [results, setResults] = useState(DEFAULT_RESULTS);
  const [stage, setStage] = useState<"intro" | "edit" | "play" | "results">("intro");
  const [bars, setBars] = useState<Bar[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [finished, setFinished] = useState<Set<number>>(new Set());
  const [routeRun, setRouteRun] = useState(0);
  const revealTimer = useRef<number | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sketch-ladder");
      if (!saved) return;
      JSON.parse(saved);
      localStorage.removeItem("sketch-ladder");
    } catch { /* 오래된 저장값은 무시합니다. */ }
  }, []);

  useEffect(() => {
    if (stage !== "intro") localStorage.setItem("sketch-ladder", JSON.stringify({ count, names, results }));
  }, [count, names, results, stage]);

  useEffect(() => () => {
    if (revealTimer.current !== null) window.clearTimeout(revealTimer.current);
  }, []);

  const changeCount = (next: number) => {
    const safe = Math.max(2, Math.min(12, next));
    setCount(safe);
    setNames((prev) => normalize(prev, safe, () => ""));
    setResults((prev) => normalize(prev, safe, () => ""));
  };

  const xFor = (index: number) => index * (1000 / (count - 1));
  const boardWidth = Math.min(460, count * 67 + (count - 1) * 7);
  const boardLeft = (548 - boardWidth) / 2;
  const slotWidth = (boardWidth - (count - 1) * 7) / count;
  const ladderLeft = boardLeft + slotWidth / 2;
  const ladderWidth = (count - 1) * (slotWidth + 7);
  const rowCount = Math.max(...bars.map((bar) => bar.row), 0) + 1;
  const selectedTrace = useMemo(() => selected === null ? null : tracePath(selected, count, bars), [selected, count, bars]);
  const selectedEnd = selected === null ? null : selectedTrace?.end ?? null;
  const allMappings = useMemo(() => names.map((name, i) => {
    const end = tracePath(i, count, bars).end;
    return { name: name || `${i + 1}`, result: results[end] || "?" };
  }), [names, results, count, bars]);

  const beginEdit = () => {
    setNames(Array(count).fill(""));
    setResults(Array(count).fill(""));
    setBars([]);
    setSelected(null);
    setRevealed(false);
    setFinished(new Set());
    setStage("edit");
  };

  const choose = (index: number) => {
    if (revealTimer.current !== null) window.clearTimeout(revealTimer.current);
    setSelected(index);
    setRevealed(false);
    setRouteRun((run) => run + 1);
    revealTimer.current = window.setTimeout(() => {
      setRevealed(true);
      setFinished((prev) => new Set(prev).add(index));
      revealTimer.current = null;
    }, 12200);
  };

  const resetPick = () => {
    if (revealTimer.current !== null) window.clearTimeout(revealTimer.current);
    revealTimer.current = null;
    setSelected(null);
    setRevealed(false);
  };

  const startGame = async () => {
    const active = names
      .map((name, i) => ({ name: name.trim(), result: (results[i] ?? "").trim() }))
      .filter((item) => item.name || item.result);
    if (active.length < 2) return;
    const entries = active;
    const adminMatch = await loadAdminMatch();
    const topItem = adminMatch.topItem.trim();
    const bottomItem = adminMatch.bottomItem.trim();
    const topIndex = topItem ? entries.findIndex((item) => item.name === topItem) : -1;
    const bottomIndex = bottomItem ? entries.findIndex((item) => item.result === bottomItem) : -1;
    const nextBars = adminMatch.enabled && topItem && bottomItem && topIndex >= 0 && bottomIndex >= 0
      ? makeBarsWithAdminMatch(entries.length, topIndex, bottomIndex)
      : makeBars(entries.length);
    setCount(entries.length);
    setNames(entries.map((item) => item.name));
    setResults(entries.map((item) => item.result));
    setBars(nextBars);
    setSelected(null);
    setRevealed(false);
    setFinished(new Set());
    setStage("play");
  };

  const goToStart = () => {
    if (revealTimer.current !== null) window.clearTimeout(revealTimer.current);
    revealTimer.current = null;
    setCount(6);
    setNames(DEFAULT_NAMES);
    setResults(DEFAULT_RESULTS);
    setBars([]);
    setSelected(null);
    setRevealed(false);
    setFinished(new Set());
    localStorage.removeItem("sketch-ladder");
    setStage("intro");
  };

  return (
    <main className="search-widget">
      <section className={`paper-stage ${stage === "intro" ? "reference-intro" : stage === "edit" ? "dynamic-edit" : stage === "play" ? "dynamic-play" : "dynamic-results"}`} aria-live="polite">
        <span className="paper-shadow paper-one" aria-hidden="true" />
        <span className="paper-shadow paper-two" aria-hidden="true" />
        <span className="paper-scrap scrap-left" aria-hidden="true" />
        <span className="paper-scrap scrap-bottom-left" aria-hidden="true" />
        <span className="paper-scrap scrap-bottom-mid" aria-hidden="true" />
        <span className="paper-scrap scrap-right" aria-hidden="true" />
        <div className="paper-card">
        <span className="tape tape-left" aria-hidden="true" />
        <span className="tape tape-right" aria-hidden="true" />

        {stage === "intro" && (
          <div className="intro-panel">
            <p className="speech">참여인원 수를 알려주세요.<br />12명까지 함께 할 수 있습니다.</p>
            <h2>사다리게임!</h2>
            <div className="scribble" aria-hidden="true" />
            <div className="counter" aria-label="참가 인원">
              <button type="button" onClick={() => changeCount(count - 1)} disabled={count <= 2} aria-label="인원 줄이기">−</button>
              <strong className="reference-count">
                {count}
                <img src={`/count-digits/${count}.png`} alt="" aria-hidden="true" draggable="false" />
              </strong>
              <button type="button" onClick={() => changeCount(count + 1)} disabled={count >= 12} aria-label="인원 늘리기">＋</button>
            </div>
            <button className="text-button start-button" type="button" onClick={beginEdit}>시작</button>
          </div>
        )}

        {(stage === "edit" || stage === "play") && (
          <div className="game-panel">
            <p className="speech compact">{stage === "edit" ? "이름과 당첨항목을 적어주세요." : "이름이나 당첨항목을 클릭하세요."}</p>
            <div className="field-row top-fields" style={{ left: boardLeft, width: boardWidth, gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
              {names.map((name, i) => stage === "edit" ? (
                <input key={i} value={name} maxLength={10} aria-label={`${i + 1}번 참가자 이름`} onChange={(e) => setNames(names.map((v, j) => j === i ? e.target.value : v))} />
              ) : (
                <button key={i} type="button" className={`name-chip ${finished.has(i) ? "finished" : ""} ${selected === i ? "selected" : ""}`} onClick={() => choose(i)}>
                  <span style={{ background: COLORS[i % COLORS.length] }}>{i + 1}</span>{name || `참가자 ${i + 1}`}
                </button>
              ))}
            </div>

            <div className="ladder-wrap" style={{ left: ladderLeft, width: ladderWidth }}>
              <svg className="ladder" viewBox="0 0 1000 560" role="img" aria-label="사다리 게임판" preserveAspectRatio="none">
                {Array.from({ length: count }, (_, i) => <line key={`v-${i}`} x1={xFor(i)} y1="50" x2={xFor(i)} y2="510" className="ladder-line" />)}
                {bars.map((bar, i) => {
                  const y = 50 + (bar.row + 1) * (460 / (rowCount + 1));
                  return <line key={`b-${i}`} x1={xFor(bar.col)} y1={y - bar.tilt} x2={xFor(bar.col + 1)} y2={y + bar.tilt} className="ladder-line rung" />;
                })}
                {selectedTrace && (
                  <polyline key={`route-${selected}-${routeRun}`} className="route-line" style={{ stroke: COLORS[selected! % COLORS.length] }} points={selectedTrace.points.map((p) => `${p.x},${p.y}`).join(" ")} />
                )}
              </svg>
            </div>
            <div className="field-row bottom-fields" style={{ left: boardLeft, width: boardWidth, gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
              {results.map((result, i) => stage === "edit" ? (
                <input key={i} value={result} maxLength={12} aria-label={`${i + 1}번 결과`} onChange={(e) => setResults(results.map((v, j) => j === i ? e.target.value : v))} />
              ) : (
                <div key={i} className={`result-chip ${revealed && selectedEnd === i ? "winner" : ""}`}>
                  {result || "?"}
                </div>
              ))}
            </div>

            {revealed && selectedTrace && (
              <div className="result-toast">
                <span>{names[selected!] || `참가자 ${selected! + 1}`}</span> → <strong>{results[selectedEnd ?? selectedTrace.end] || "결과 없음"}</strong>
              </div>
            )}

            <div className="actions">
              <button type="button" className="text-button muted" onClick={() => setStage("intro")}>돌아가기</button>
              {stage === "edit" ? (
                <button type="button" className="text-button primary" onClick={startGame}>사다리 시작</button>
              ) : selected !== null ? (
                <button type="button" className="text-button primary" onClick={resetPick}>{revealed ? "다른 사람 보기" : "진행 중..."}</button>
              ) : (
                <button type="button" className="text-button primary" onClick={beginEdit}>다시 만들기</button>
              )}
            </div>
            {stage === "play" && (
              <button type="button" className="all-results-button" onClick={() => setStage("results")}>
                전체 결과 보기
              </button>
            )}
          </div>
        )}
        {stage === "results" && (
          <div className="results-panel">
            <ol>
              {allMappings.map((item, i) => (
                <li key={i}><strong>• {item.name}</strong><span>→ {item.result}</span></li>
              ))}
            </ol>
            <button type="button" onClick={goToStart}>다시하기</button>
          </div>
        )}
        </div>
      </section>
    </main>
  );
}
