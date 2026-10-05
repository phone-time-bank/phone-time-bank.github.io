const CAP_SEC = 1800;
const MIN_ON_SEC = 60;
const START_BANK_SEC = 0;

function createState(now) {
  return { state: 'LOCKED', bankSec: START_BANK_SEC, lastTs: now, startTs: now, onCount: 0, usedSec: 0 };
}

// 순수 함수: 마지막 저장 시점부터 now까지 흐른 시간을 반영한 새 상태를 돌려준다.
// speed는 개발용 배속 (?speed=60).
function applyElapsed(saved, now, speed = 1) {
  const s = { ...saved, lastTs: now };
  let elapsed = Math.max(0, (now - saved.lastTs) / 1000) * speed;

  if (s.state === 'ACTIVE') {
    if (elapsed < s.bankSec) {
      s.bankSec -= elapsed;
      s.usedSec += elapsed;
      return s;
    }
    // 0이 된 시점에 LOCKED로 전환하고, 남은 시간은 적립으로 넘긴다.
    elapsed -= s.bankSec;
    s.usedSec += s.bankSec;
    s.bankSec = 0;
    s.state = 'LOCKED';
  }

  s.bankSec = Math.min(CAP_SEC, s.bankSec + elapsed);
  return s;
}

function canTurnOn(s) {
  return s.state === 'LOCKED' && s.bankSec >= MIN_ON_SEC;
}

function turnOn(saved, now, speed = 1) {
  const s = applyElapsed(saved, now, speed);
  if (!canTurnOn(s)) return s;
  return { ...s, state: 'ACTIVE', onCount: s.onCount + 1 };
}

function turnOff(saved, now, speed = 1) {
  const s = applyElapsed(saved, now, speed);
  return { ...s, state: 'LOCKED' };
}

function formatMMSS(sec) {
  const m = Math.floor(sec / 60);
  const ss = sec % 60;
  return String(m).padStart(2, '0') + ':' + String(ss).padStart(2, '0');
}

// 시작한 날을 1일째로 치는 달력 기준 일수
function dayCount(startTs, now) {
  const a = new Date(startTs); a.setHours(0, 0, 0, 0);
  const b = new Date(now); b.setHours(0, 0, 0, 0);
  return Math.round((b - a) / 86400000) + 1;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CAP_SEC, MIN_ON_SEC, START_BANK_SEC,
    createState, applyElapsed, canTurnOn, turnOn, turnOff, formatMMSS, dayCount,
  };
}
