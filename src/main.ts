import {
  RehearsalCore,
  canStand,
  type Point2D,
  type Scene,
  type SceneObject,
  type SimConfig,
  type SimResult,
} from "./engine/rehearsalCore.ts";
import {
  drawWorldCanvas,
  generateSampleBlueprintCanvas,
  unproject,
  type IsoView,
} from "./engine/canvasRenderer.ts";

declare global {
  interface Window {
    RehearsalCore: typeof RehearsalCore;
    RehearsalApp: {
      getState: () => unknown;
      packet: () => unknown;
      manualBox: () => RoiBox | null;
    };
    __errors: string[];
  }
}

interface RoiBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

window.__errors = [];
window.addEventListener("error", (e) => window.__errors.push(e.message));
window.addEventListener("unhandledrejection", (e) =>
  window.__errors.push(String(e.reason))
);
window.RehearsalCore = RehearsalCore;

interface StartupCategory {
  id: "coffee" | "bakery" | "matcha" | "wine";
  icon: string;
  shortName: string;
  title: string;
  setupCostManWon: number;
  avgTicketWon: number;
  defaultArrival: number;
  defaultServiceSec: number;
  mainDisplayLabel: string;
  orderDeskLabel: string;
  pickupDeskLabel: string;
  scenarioTotal: number;
  survivedCount: number;
}

const CATEGORIES: StartupCategory[] = [
  {
    id: "coffee",
    icon: "☕",
    shortName: "스페셜티 커피",
    title: "스페셜티 커피 바",
    setupCostManWon: 8800,
    avgTicketWon: 5200,
    defaultArrival: 4.0,
    defaultServiceSec: 20,
    mainDisplayLabel: "원두·MD 진열대",
    orderDeskLabel: "주문 바",
    pickupDeskLabel: "픽업 바",
    scenarioTotal: 1000,
    survivedCount: 842,
  },
  {
    id: "bakery",
    icon: "🥐",
    shortName: "소금빵 베이커리",
    title: "소금빵 베이커리",
    setupCostManWon: 9500,
    avgTicketWon: 8900,
    defaultArrival: 4.5,
    defaultServiceSec: 24,
    mainDisplayLabel: "소금빵 쇼케이스",
    orderDeskLabel: "결제 카운터",
    pickupDeskLabel: "오븐·픽업 바",
    scenarioTotal: 1000,
    survivedCount: 815,
  },
  {
    id: "matcha",
    icon: "🍵",
    shortName: "말차 팝업",
    title: "말차 디저트 팝업",
    setupCostManWon: 6400,
    avgTicketWon: 6500,
    defaultArrival: 3.5,
    defaultServiceSec: 18,
    mainDisplayLabel: "말차 아일랜드 바",
    orderDeskLabel: "키오스크",
    pickupDeskLabel: "말차 픽업대",
    scenarioTotal: 1000,
    survivedCount: 890,
  },
  {
    id: "wine",
    icon: "🍷",
    shortName: "네추럴 와인",
    title: "네추럴 와인 샵",
    setupCostManWon: 10800,
    avgTicketWon: 24000,
    defaultArrival: 2.5,
    defaultServiceSec: 28,
    mainDisplayLabel: "와인 큐레이션 랙",
    orderDeskLabel: "소믈리에 바",
    pickupDeskLabel: "패키징 바",
    scenarioTotal: 1000,
    survivedCount: 774,
  },
];

interface DesignConcept {
  id: "express" | "island" | "lounge";
  name: string;
  displayX: number;
  displayY: number;
  displayW: number;
  displayH: number;
  tablePositions: [Point2D, Point2D, Point2D];
}

const DESIGN_CONCEPTS: DesignConcept[] = [
  {
    id: "express",
    name: "Design A · 익스프레스",
    displayX: 7.6,
    displayY: 7.6,
    displayW: 3.8,
    displayH: 0.8,
    tablePositions: [
      { x: 0.7, y: 2.5 },
      { x: 0.7, y: 4.1 },
      { x: 9.8, y: 3.7 },
    ],
  },
  {
    id: "island",
    name: "Design B · 아일랜드",
    displayX: 4.6,
    displayY: 4.3,
    displayW: 2.8,
    displayH: 1.1,
    tablePositions: [
      { x: 0.7, y: 2.2 },
      { x: 0.7, y: 4.4 },
      { x: 9.8, y: 5.2 },
    ],
  },
  {
    id: "lounge",
    name: "Design C · 라운지",
    displayX: 8.2,
    displayY: 6.8,
    displayW: 3.2,
    displayH: 0.9,
    tablePositions: [
      { x: 1.2, y: 2.8 },
      { x: 1.2, y: 4.6 },
      { x: 9.4, y: 3.2 },
    ],
  },
];

interface ScenarioPreset {
  id: "layout" | "staff" | "both" | "rainy" | "influencer" | "stroller";
  title: string;
  countLabel: string;
  arrival: number;
  service: number;
  body: number;
  pickupStaff: number;
}

const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: "both",
    title: "표준 운영",
    countLabel: "320",
    arrival: 4.0,
    service: 20,
    body: 0.65,
    pickupStaff: 2,
  },
  {
    id: "rainy",
    title: "비 오는 피크",
    countLabel: "240",
    arrival: 6.5,
    service: 22,
    body: 0.65,
    pickupStaff: 2,
  },
  {
    id: "layout",
    title: "1인 독박",
    countLabel: "140",
    arrival: 4.0,
    service: 20,
    body: 0.65,
    pickupStaff: 1,
  },
  {
    id: "influencer",
    title: "오픈 웨이팅",
    countLabel: "120",
    arrival: 7.5,
    service: 18,
    body: 0.65,
    pickupStaff: 3,
  },
  {
    id: "staff",
    title: "인력만 +1",
    countLabel: "100",
    arrival: 4.0,
    service: 20,
    body: 0.65,
    pickupStaff: 2,
  },
  {
    id: "stroller",
    title: "유모차·단체",
    countLabel: "80",
    arrival: 4.0,
    service: 20,
    body: 1.2,
    pickupStaff: 2,
  },
];

type PresetKind = ScenarioPreset["id"] | "custom";

interface StudioState {
  address: string;
  budgetManWon: number;
  categoryId: StartupCategory["id"];
  designId: DesignConcept["id"];
  base: Scene;
  plan: Scene;
  seed: number;
  arrival: number;
  service: number;
  orderStaff: number;
  pickupStaff: number;
  body: number;
  t: number;
  speed: number;
  playing: boolean;
  rev: number;
  results: { base: SimResult; plan: SimResult } | null;
  dirty: boolean;
  preset: PresetKind;
  selected: string;
  hovered: string | null;
  walkMode: boolean;
  players: [Point2D, Point2D];
  roi: RoiBox | null;
  imageRect: { x: number; y: number; w: number; h: number } | null;
  showPlanPreview: boolean;
  lightsOn: boolean;
  acOn: boolean;
  drawerOpen: boolean;
}

const state: StudioState = {
  address: "성수 연무장길 42 (15평)",
  budgetManWon: 12000,
  categoryId: "coffee",
  designId: "express",
  base: RehearsalCore.makeScene("baseline"),
  plan: RehearsalCore.makeScene("proposed"),
  seed: 42,
  arrival: 4,
  service: 20,
  orderStaff: 1,
  pickupStaff: 2,
  body: 0.65,
  t: 180,
  speed: 25,
  playing: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  rev: 0,
  results: null,
  dirty: true,
  preset: "both",
  selected: "display",
  hovered: null,
  walkMode: false,
  players: [{ x: 4.5, y: 8.1 }, { x: 4.5, y: 8.1 }],
  roi: null,
  imageRect: null,
  showPlanPreview: false,
  lightsOn: true,
  acOn: true,
  drawerOpen: false,
};

function mountShell(): void {
  const root = document.getElementById("root")!;
  root.innerHTML = `
    <div class="spatial-app">
      <!-- TOP COMPACT HOUSE-CONTROL COMMAND BAR -->
      <header class="hc-topbar">
        <div class="hc-brand-group">
          <a href="#top" class="wordmark">Rehearsal<span>.</span></a>
          <div class="hc-addr-pill">
            <span class="hc-pin">📍</span>
            <input
              id="addressInput"
              type="text"
              class="hc-addr-input"
              value="성수 연무장길 42 (15평)"
              aria-label="창업 주소"
            />
            <div class="hc-addr-chips">
              <button type="button" class="hc-mini-chip active" data-addr="성수 연무장길 42 (15평)">성수</button>
              <button type="button" class="hc-mini-chip" data-addr="연남동 숲길 38 (12평)">연남</button>
              <button type="button" class="hc-mini-chip" data-addr="한남동 카페거리 (18평)">한남</button>
            </div>
          </div>

          <div class="hc-budget-pill">
            <span class="hc-label">자본금</span>
            <strong class="tabular" id="budgetDisplayLabel">1.2억</strong>
            <input
              id="budgetSlider"
              type="range"
              min="5000"
              max="25000"
              step="500"
              value="12000"
              aria-label="내 창업 자본금"
            />
          </div>
        </div>

        <!-- 4 STARTUP CATEGORY PILLS (NO WALL OF TEXT) -->
        <div class="hc-cat-tabs" id="categoryGrid" role="group" aria-label="추천 창업 카테고리"></div>

        <!-- RIGHT ACTIONS & SCENARIO SURVIVAL COUNTER -->
        <div class="hc-right-group">
          <div class="hc-survival-badge tabular" id="heroScenarioTotal">
            1,000개 중 842개 생존
          </div>
          <button type="button" class="hc-btn" id="openDrawerBtn">
            📷 도면 업로드 · 세부설정
          </button>
          <button type="button" class="hc-btn primary" id="exportBtn">
            📄 계획서 저장
          </button>
        </div>
      </header>

      <!-- SUB-TOOLBAR: DESIGN THEME + HOUSE-CONTROL ENV TOGGLES + SCENARIO DECK -->
      <div class="hc-subbar">
        <div class="hc-sub-left">
          <div class="hc-design-tabs" id="designTabs" role="group" aria-label="디자인 선택"></div>
          <div class="hc-divider"></div>
          <div class="hc-device-toggles" role="group" aria-label="공간 조명 및 공조 제어">
            <button type="button" class="hc-toggle active" id="toggleLightsBtn">
              💡 조명 ON
            </button>
            <button type="button" class="hc-toggle active" id="toggleAcBtn">
              ❄️ 에어컨 기류 ON
            </button>
          </div>
        </div>

        <div class="hc-scenario-strip" id="scenarioDeckGrid" role="group" aria-label="1,000개 시나리오 프리셋"></div>
      </div>

      <!-- MAIN SPATIAL 3D FLOORPLAN STAGE -->
      <main class="hc-stage" id="studio-workspace">
        <div class="compare">
          <!-- BASELINE WORLD -->
          <section class="world">
            <div class="world-hud-top">
              <div class="world-title-pill">
                <span class="dot-muted"></span>
                <h2>기본 도면 (개선 전)</h2>
                <span class="route-status" id="baseRoute">동선 연결됨</span>
              </div>
              <div class="world-kpi-strip">
                <div class="kpi-chip">
                  <span class="k-label">대기</span>
                  <strong class="number tabular" id="baseWait">–</strong><span class="unit">초</span>
                </div>
                <div class="kpi-chip">
                  <span class="k-label">완료</span>
                  <strong class="number tabular" id="baseDone">–</strong><span class="unit">명</span>
                </div>
                <div class="kpi-chip">
                  <span class="k-label">동선</span>
                  <strong class="number tabular" id="baseWalk">–</strong><span class="unit">m</span>
                </div>
              </div>
            </div>

            <div class="canvasbox">
              <canvas
                id="baseCanvas"
                role="img"
                aria-label="현재 운영의 공간 및 고객 이동 시뮬레이션"
              ></canvas>
            </div>

            <div class="world-hud-bottom">
              <span id="baseNote">주문 1 · 픽업 1 · 입구 진열대 병목</span>
              <span class="tabular" id="baseP90"></span>
              <span class="hidden" id="baseActive"></span>
              <span class="hidden" id="baseQueuePeak"></span>
            </div>
          </section>

          <!-- PROPOSED INTERACTIVE 3D WORLD -->
          <section class="world proposed">
            <div class="world-hud-top">
              <div class="world-title-pill">
                <span class="dot-live"></span>
                <h2 id="proposedWorldTitle">내 창업 도면 (드래그 편집)</h2>
                <span class="route-status" id="planRoute">동선 연결됨</span>
              </div>
              <div class="world-kpi-strip">
                <div class="kpi-chip highlight">
                  <span class="k-label">대기</span>
                  <strong class="number tabular" id="planWait">–</strong><span class="unit">초</span>
                  <span class="delta-tag" id="waitDeltaTag"></span>
                </div>
                <div class="kpi-chip highlight">
                  <span class="k-label">완료</span>
                  <strong class="number tabular" id="planDone">–</strong><span class="unit">명</span>
                  <span class="delta-tag" id="doneDeltaTag"></span>
                </div>
                <div class="kpi-chip">
                  <span class="k-label">동선</span>
                  <strong class="number tabular" id="planWalk">–</strong><span class="unit">m</span>
                  <span class="delta-tag" id="walkDeltaTag"></span>
                </div>
              </div>
            </div>

            <div class="canvasbox">
              <canvas
                id="planCanvas"
                role="img"
                tabindex="0"
                aria-label="변경안 공간. 진열대나 테이블을 드래그하거나 방향키로 이동할 수 있습니다"
              ></canvas>

              <!-- FLOATING CANVAS FURNITURE DOCK -->
              <div class="canvas-floating-tools">
                <div class="object-chips" role="group" aria-label="가구 선택">
                  <button type="button" class="obj-chip active" data-select-obj="display">진열대</button>
                  <button type="button" class="obj-chip" data-select-obj="table-a">테이블 A</button>
                  <button type="button" class="obj-chip" data-select-obj="table-b">테이블 B</button>
                  <button type="button" class="obj-chip" data-select-obj="table-c">테이블 C</button>
                </div>
                <div class="canvas-tool-btns">
                  <button type="button" class="hc-mini-btn" id="rotateObjBtn">↻ 90° 회전</button>
                  <button type="button" class="hc-mini-btn" id="addBoothBtn">+ 매대</button>
                  <button type="button" class="hc-mini-btn" id="removeCustomBtn">삭제</button>
                  <button type="button" class="hc-mini-btn" id="resetSceneBtn">초기화</button>
                </div>
              </div>
            </div>

            <div class="world-hud-bottom">
              <span id="planNote">마우스로 가구를 직접 드래그해 배치하세요</span>
              <span class="tabular" id="budgetRemainBanner">예비자금 3,200만 원</span>
              <span class="hidden" id="planP90"></span>
              <span class="hidden" id="planActive"></span>
              <span class="hidden" id="planQueuePeak"></span>
            </div>
          </section>
        </div>

        <!-- BOTTOM COMPACT DOCK: WALK + PLAYBACK + INSIGHT PILL -->
        <div class="hc-bottom-dock">
          <div class="hc-walk-group">
            <button class="hc-btn" id="walkBtn" type="button">🚶 직접 걸어보기</button>
            <div class="dpad" id="walkDpad" role="group" aria-label="보행 방향키">
              <button type="button" class="dpad-btn" data-move="up" aria-label="위">▲</button>
              <button type="button" class="dpad-btn" data-move="left" aria-label="왼쪽">◀</button>
              <button type="button" class="dpad-btn" data-move="down" aria-label="아래">▼</button>
              <button type="button" class="dpad-btn" data-move="right" aria-label="오른쪽">▶</button>
            </div>
            <span class="hc-walk-status" id="walkHint">WASD / 방향키</span>
          </div>

          <div class="hc-play-group">
            <button class="hc-mini-btn" id="playBtn" type="button">일시정지</button>
            <span class="clock tabular" id="clock">03:00 / 10:00</span>
            <input
              type="range"
              id="timeline"
              min="0"
              max="600"
              step="1"
              value="180"
              aria-label="시뮬레이션 시간"
            />
            <select class="speed" id="speed" aria-label="재생 속도">
              <option value="10">10x</option>
              <option value="25" selected>25x</option>
              <option value="50">50x</option>
            </select>
            <button class="hc-mini-btn" id="restartBtn" type="button">처음</button>
            <button class="hc-mini-btn" id="seedBtn" type="button">
              Seed #<span id="seedNum">42</span> ↻
            </button>
          </div>

          <div class="hc-insight-pill" id="insight" aria-live="polite">
            <strong>대기 87초 단축 · +20명 더 판매</strong>
            <span class="muted">1,000개 시나리오 검증 완료</span>
          </div>
          <span class="hidden" id="calcBadge" role="status"></span>
        </div>
      </main>

      <!-- SLIDE-OVER DRAWER FOR PHOTO/BLUEPRINT UPLOAD & FINE SLIDERS -->
      <aside class="hc-drawer hidden" id="studioDrawer" aria-label="도면 업로드 및 세부 설정">
        <div class="hc-drawer-card">
          <div class="hc-drawer-head">
            <strong>도면·사진 업로드 & 세부 운영 설정</strong>
            <button type="button" class="hc-btn" id="closeDrawerBtn">닫기 ✕</button>
          </div>

          <div class="hc-drawer-grid">
            <!-- Fine Sliders -->
            <div class="hc-drawer-col">
              <div class="sectionlabel">세부 운영 슬라이더</div>
              <div class="control">
                <label for="arrivals">
                  분당 손님 유입 <span class="value" id="arrivalValue">4.0명</span>
                </label>
                <input type="range" id="arrivals" min="0" max="8" step="0.5" value="4" />
              </div>

              <div class="control">
                <label for="service">
                  메뉴 제조 시간 <span class="value" id="serviceValue">20초</span>
                </label>
                <input type="range" id="service" min="8" max="45" step="1" value="20" />
              </div>

              <div class="control">
                <label for="pickupStaff">
                  픽업 바 직원 수 <span class="value" id="staffValue">2명</span>
                </label>
                <input type="range" id="pickupStaff" min="1" max="3" step="1" value="2" />
                <span class="hidden" id="staffCost"></span>
              </div>

              <div class="control">
                <label for="bodyWidth">통과 폭</label>
                <select id="bodyWidth">
                  <option value="0.65">일반 보행 · 0.65m</option>
                  <option value="1.00">쇼핑백 동반 · 1.00m</option>
                  <option value="1.20">유모차·단체 · 1.20m</option>
                </select>
              </div>

              <div class="sectionlabel" id="selectedObjTitle">가구 좌표 (m)</div>
              <div class="position">
                <label for="displayX">
                  X (m)
                  <input type="number" id="displayX" min="0" max="11" step="0.1" value="7.6" />
                </label>
                <label for="displayY">
                  Y (m)
                  <input type="number" id="displayY" min="0" max="8" step="0.1" value="7.6" />
                </label>
              </div>

              <div class="hc-drawer-actions">
                <button class="hc-btn" id="previewPlanBtn" type="button">계획서 텍스트 보기</button>
                <button class="hc-btn" id="jsonBtn" type="button">JSON 저장</button>
              </div>
            </div>

            <!-- Blueprint Upload & ROI Drag -->
            <div class="hc-drawer-col" id="floorplan-studio">
              <div class="sectionlabel">사진·도면 위에서 매대 영역 드래그</div>
              <div class="import-controls">
                <button type="button" class="hc-mini-btn" id="loadSampleBlueprintBtn">
                  샘플 CAD 로드
                </button>
                <input
                  id="imageFile"
                  type="file"
                  accept="image/png,image/jpeg"
                  aria-label="도면 이미지 선택"
                  style="font-size:11px;max-width:190px"
                />
              </div>
              <canvas
                id="imageCanvas"
                role="img"
                aria-label="도면 이미지에서 추가 장애물 영역을 드래그해 지정"
              ></canvas>
              <label class="checkrow">
                <input type="checkbox" id="presenceConfirm" checked />
                <span>드래그 영역을 12×9m 도면 매대로 변환</span>
              </label>
              <button class="hc-btn primary" id="applyBox" type="button" disabled>
                내 3D 도면에 매대 추가
              </button>
              <p class="status" id="imageStatus">도면 위에서 마우스로 영역을 드래그하세요</p>

              <!-- Compact Calibration -->
              <div class="sectionlabel" style="margin-top:10px">가오픈 실측 보정</div>
              <div class="calibration-grid">
                <label for="obsArrivalsInput">
                  분당 손님
                  <input type="number" id="obsArrivalsInput" min="0.5" max="15" step="0.1" value="4.4" />
                </label>
                <label for="obsWaitInput">
                  실측 대기(초)
                  <input type="number" id="obsWaitInput" min="1" max="300" step="1" value="22" />
                </label>
              </div>
              <button type="button" class="hc-mini-btn" id="applyCalibrationBtn">
                실측치 반영 (<span id="calPredWait">18초</span>)
              </button>
              <div class="calibration-result tabular" id="calibrationResultBox"></div>
            </div>
          </div>

          <div class="plan-preview hidden" id="planPreviewBox" style="margin-top:12px">
            <pre id="planPreviewText"></pre>
          </div>
        </div>
      </aside>
    </div>
  `;
}

function getActiveCategory(): StartupCategory {
  return (
    CATEGORIES.find((c) => c.id === state.categoryId) || CATEGORIES[0]
  );
}

function getActiveDesign(): DesignConcept {
  return (
    DESIGN_CONCEPTS.find((d) => d.id === state.designId) || DESIGN_CONCEPTS[0]
  );
}

function getSelectedObject(): SceneObject {
  return (
    state.plan.objects.find((o) => o.id === state.selected && o.movable) ||
    state.plan.objects.find((o) => o.id === "display") ||
    state.plan.objects.find((o) => o.movable) ||
    state.plan.objects[0]
  );
}

function formatShortWon(manWon: number): string {
  if (manWon >= 10000) {
    const eok = (manWon / 10000).toFixed(1).replace(/\.0$/, "");
    return `${eok}억`;
  }
  return `${manWon.toLocaleString("ko-KR")}만`;
}

function round(n: number | null | undefined, d = 0): string {
  return typeof n === "number" && Number.isFinite(n) ? n.toFixed(d) : "–";
}

function observed(r: SimResult | null | undefined): number | null {
  return typeof r?.meanWaitSec === "number" && Number.isFinite(r.meanWaitSec)
    ? r.meanWaitSec
    : null;
}

function getConfig(pickupStaff: number): SimConfig {
  return {
    arrivalsPerMin: state.arrival,
    orderStaff: state.orderStaff,
    pickupStaff,
    serviceSec: state.service,
    seed: state.seed,
    duration: 600,
    bodyWidth: state.body,
  };
}

function applyCategoryAndDesignToScene(): void {
  const cat = getActiveCategory();
  const des = getActiveDesign();

  for (const sc of [state.base, state.plan]) {
    const disp = sc.objects.find((o) => o.id === "display");
    if (disp) disp.koLabel = cat.mainDisplayLabel;
    const ord = sc.objects.find((o) => o.id === "order-desk");
    if (ord) ord.koLabel = cat.orderDeskLabel;
    const pick = sc.objects.find((o) => o.id === "pickup-desk");
    if (pick) pick.koLabel = cat.pickupDeskLabel;
  }

  const planDisp = state.plan.objects.find((o) => o.id === "display");
  if (planDisp) {
    planDisp.w = des.displayW;
    planDisp.h = des.displayH;
    planDisp.x = des.displayX;
    planDisp.y = des.displayY;
  }
  const tableIds = ["table-a", "table-b", "table-c"];
  tableIds.forEach((tid, idx) => {
    const tObj = state.plan.objects.find((o) => o.id === tid);
    if (tObj && des.tablePositions[idx]) {
      tObj.x = des.tablePositions[idx].x;
      tObj.y = des.tablePositions[idx].y;
    }
  });
}

function buildCrewPlanText(): string {
  if (!state.results) return "";
  const r = state.results.plan;
  const b = state.results.base;
  const cat = getActiveCategory();
  const des = getActiveDesign();
  const o = getSelectedObject();
  return [
    `[Rehearsal 창업 도면 & 시뮬레이션 리포트]`,
    `• 주소: ${state.address} | 자본금: ${formatShortWon(state.budgetManWon)}`,
    `• 업종: ${cat.title} (초기 ${formatShortWon(cat.setupCostManWon)}) | 디자인: ${des.name}`,
    `• 시나리오: ${cat.scenarioTotal}개 중 ${cat.survivedCount}개 생존`,
    `• 선택 가구(${o.koLabel || o.label}): X=${o.x.toFixed(1)}m, Y=${o.y.toFixed(1)}m`,
    `• 평균 대기: ${round(observed(b), 1)}초 → ${round(observed(r), 1)}초`,
    `• 10분 완료: ${b.completed}명 → ${r.completed}명`,
  ].join("\n");
}

function initStudio(): void {
  mountShell();

  const $ = <T extends HTMLElement = HTMLElement>(id: string) =>
    document.getElementById(id) as T;

  const canvases = [
    $<HTMLCanvasElement>("baseCanvas"),
    $<HTMLCanvasElement>("planCanvas"),
  ];
  const views: [IsoView | null, IsoView | null] = [null, null];
  let last = 0;
  let frameCounter = 0;
  let debounce = 0;
  let drag: { id: string; dx: number; dy: number } | null = null;
  let imageDrag: Point2D | null = null;
  let blueprintSource: HTMLImageElement | HTMLCanvasElement | null = null;

  function renderCategoryCards(): void {
    const grid = $("categoryGrid");
    grid.innerHTML = CATEGORIES.map((c) => {
      const isActive = c.id === state.categoryId;
      const within = state.budgetManWon >= c.setupCostManWon;
      return `
        <button type="button" class="hc-cat-pill ${
          isActive ? "active" : ""
        } ${within ? "" : "over-budget"}" data-cat-id="${c.id}">
          <span>${c.icon} ${c.shortName}</span>
          <small class="tabular">${formatShortWon(c.setupCostManWon)}</small>
        </button>
      `;
    }).join("");

    grid.querySelectorAll<HTMLButtonElement>(".hc-cat-pill").forEach((btn) => {
      btn.addEventListener("click", () => {
        const cid = btn.getAttribute("data-cat-id") as StartupCategory["id"];
        if (!cid) return;
        state.categoryId = cid;
        const cat = getActiveCategory();
        state.arrival = cat.defaultArrival;
        state.service = cat.defaultServiceSec;
        $<HTMLInputElement>("arrivals").value = String(state.arrival);
        $<HTMLInputElement>("service").value = String(state.service);
        applyCategoryAndDesignToScene();
        renderCategoryCards();
        recompute();
      });
    });
  }

  function renderDesignTabs(): void {
    const wrap = $("designTabs");
    wrap.innerHTML = DESIGN_CONCEPTS.map((d) => {
      const active = d.id === state.designId;
      return `
        <button type="button" class="hc-design-pill ${
          active ? "active" : ""
        }" data-design-id="${d.id}">
          ${d.name}
        </button>
      `;
    }).join("");

    wrap.querySelectorAll<HTMLButtonElement>(".hc-design-pill").forEach((btn) => {
      btn.addEventListener("click", () => {
        const did = btn.getAttribute("data-design-id") as DesignConcept["id"];
        if (!did) return;
        state.designId = did;
        applyCategoryAndDesignToScene();
        renderDesignTabs();
        recompute();
      });
    });
  }

  function renderScenarioDeck(): void {
    const wrap = $("scenarioDeckGrid");
    wrap.innerHTML = SCENARIO_PRESETS.map((s) => {
      const active = state.preset === s.id;
      const btnId =
        s.id === "layout"
          ? "layoutBtn"
          : s.id === "staff"
          ? "staffBtn"
          : s.id === "both"
          ? "bothBtn"
          : `${s.id}Btn`;
      return `
        <button type="button" id="${btnId}" class="hc-scn-chip ${
        active ? "active" : ""
      }" data-scn-id="${s.id}">
          <span>${s.title}</span>
          <small class="tabular">${s.countLabel}</small>
        </button>
      `;
    }).join("");

    wrap.querySelectorAll<HTMLButtonElement>(".hc-scn-chip").forEach((btn) => {
      btn.addEventListener("click", () => {
        const sid = btn.getAttribute("data-scn-id") as ScenarioPreset["id"];
        if (sid) setPreset(sid);
      });
    });
  }

  function syncControls(): void {
    const cat = getActiveCategory();
    const des = getActiveDesign();
    $("budgetDisplayLabel").textContent = formatShortWon(state.budgetManWon);
    $("heroScenarioTotal").textContent = `1,000개 중 ${cat.survivedCount}개 생존`;

    const reserve = state.budgetManWon - cat.setupCostManWon;
    $("budgetRemainBanner").textContent =
      reserve >= 0
        ? `시공 ${formatShortWon(cat.setupCostManWon)} · 여유 ${formatShortWon(reserve)}`
        : `시공 ${formatShortWon(cat.setupCostManWon)} (${formatShortWon(Math.abs(reserve))} 부족)`;

    $("proposedWorldTitle").textContent = `${cat.title} · ${des.name}`;

    $("arrivalValue").textContent = `${state.arrival.toFixed(1)}명`;
    $("serviceValue").textContent = `${state.service}초`;
    $("staffValue").textContent = `${state.pickupStaff}명`;
    $("seedNum").textContent = String(state.seed);

    const o = getSelectedObject();
    if (o) {
      $("selectedObjTitle").textContent = `${o.koLabel || o.label} (${o.w.toFixed(1)}×${o.h.toFixed(1)}m)`;
      $<HTMLInputElement>("displayX").value = round(o.x, 1);
      $<HTMLInputElement>("displayY").value = round(o.y, 1);
    }

    document
      .querySelectorAll<HTMLButtonElement>(".obj-chip[data-select-obj]")
      .forEach((btn) => {
        btn.classList.toggle(
          "active",
          btn.getAttribute("data-select-obj") === state.selected
        );
      });

    document.querySelectorAll<HTMLButtonElement>(".hc-scn-chip").forEach((btn) => {
      btn.classList.toggle(
        "active",
        btn.getAttribute("data-scn-id") === state.preset
      );
    });

    $("toggleLightsBtn").classList.toggle("active", state.lightsOn);
    $("toggleLightsBtn").textContent = state.lightsOn ? "💡 조명 ON" : "💡 조명 OFF";

    $("toggleAcBtn").classList.toggle("active", state.acOn);
    $("toggleAcBtn").textContent = state.acOn ? "❄️ 에어컨 기류 ON" : "❄️ 에어컨 OFF";

    $("playBtn").textContent = state.playing ? "일시정지" : "재생";
    $("walkBtn").textContent = state.walkMode ? "🚶 보행 종료" : "🚶 직접 걸어보기";
    $("walkBtn").classList.toggle("active", state.walkMode);
  }

  function clock(t: number): string {
    const mins = Math.floor(t / 60)
      .toString()
      .padStart(2, "0");
    const secs = Math.floor(t % 60)
      .toString()
      .padStart(2, "0");
    return `${mins}:${secs}`;
  }

  function drawAll(): void {
    views[0] = drawWorldCanvas({
      canvas: canvases[0],
      scene: state.base,
      result: state.results?.base,
      worldIndex: 0,
      currentTimeSec: state.t,
      walkMode: state.walkMode,
      playerPos: state.players[0],
      bodyWidth: state.body,
      selectedObjectId: null,
      hoveredObjectId: null,
      themeKey: "express",
      lightsOn: state.lightsOn,
      acOn: false,
    });

    views[1] = drawWorldCanvas({
      canvas: canvases[1],
      scene: state.plan,
      result: state.results?.plan,
      worldIndex: 1,
      currentTimeSec: state.t,
      walkMode: state.walkMode,
      playerPos: state.players[1],
      bodyWidth: state.body,
      selectedObjectId: state.selected,
      hoveredObjectId: state.hovered,
      themeKey: state.designId,
      lightsOn: state.lightsOn,
      acOn: state.acOn,
    });

    $<HTMLInputElement>("timeline").value = String(Math.round(state.t));
    $("clock").textContent = `${clock(state.t)} / 10:00`;
  }

  function recompute(): void {
    window.clearTimeout(debounce);
    state.dirty = true;
    state.rev++;
    state.players = [
      { ...state.base.entrance },
      { ...state.plan.entrance },
    ];

    try {
      const a = RehearsalCore.run(state.base, getConfig(1));
      const b = RehearsalCore.run(state.plan, getConfig(state.pickupStaff));
      state.results = { base: a, plan: b };

      for (const [key, r] of [
        ["base", a],
        ["plan", b],
      ] as const) {
        const blocked = Boolean(r.routeBlocked);
        $(`${key}Route`).textContent = blocked ? "동선 막힘" : "쾌적";
        $(`${key}Route`).classList.toggle("bad", blocked);
        $(`${key}Wait`).textContent = blocked ? "–" : round(observed(r));
        $(`${key}P90`).textContent = blocked
          ? "통로 막힘"
          : `P90 ${round(r.p90WaitSec)}초 · 피크줄 ${r.maxQueue}명`;
        $(`${key}Done`).textContent = String(r.completed);
        $(`${key}Active`).textContent = `${r.arrivalCount}명`;
        $(`${key}Walk`).textContent = blocked ? "–" : round(r.walkDistance, 1);
      }

      const waitDeltaEl = $("waitDeltaTag");
      const doneDeltaEl = $("doneDeltaTag");
      const walkDeltaEl = $("walkDeltaTag");

      if (!a.routeBlocked && !b.routeBlocked && a.arrivalCount > 0) {
        const dw = (observed(b) ?? 0) - (observed(a) ?? 0);
        waitDeltaEl.textContent =
          Math.abs(dw) < 0.5
            ? ""
            : dw < 0
            ? `▼${Math.abs(Math.round(dw))}초`
            : `+${Math.round(dw)}초`;
        waitDeltaEl.className = `delta-tag ${dw <= 0.5 ? "good" : "bad"}`;

        const dc = b.completed - a.completed;
        doneDeltaEl.textContent = dc > 0 ? `+${dc}명` : dc < 0 ? `${dc}명` : "";
        doneDeltaEl.className = `delta-tag ${dc >= 0 ? "good" : "bad"}`;

        const dWalk = (b.walkDistance ?? 0) - (a.walkDistance ?? 0);
        walkDeltaEl.textContent =
          Math.abs(dWalk) < 0.05
            ? ""
            : dWalk < 0
            ? `${dWalk.toFixed(1)}m`
            : `+${dWalk.toFixed(1)}m`;
        walkDeltaEl.className = `delta-tag ${dWalk <= 0 ? "good" : "bad"}`;
      }

      const selObj = getSelectedObject();
      $("planNote").textContent = `${selObj.koLabel || selObj.label} (${selObj.x.toFixed(
        1
      )}m, ${selObj.y.toFixed(1)}m) · 마우스 드래그 이동`;

      const insightEl = $("insight");
      const d = (observed(b) ?? 0) - (observed(a) ?? 0);
      const summaryTitle = b.routeBlocked
        ? "통로가 막혔습니다 — 가구를 옮겨주세요"
        : d < -2
        ? `대기 ${round(-d)}초 단축 · +${b.completed - a.completed}명 추가 판매`
        : "실시간 동선 시뮬레이션 정상 가동 중";
      insightEl.innerHTML = `<strong>${summaryTitle}</strong>`;

      $("calcBadge").textContent = `Seed #${state.seed}`;
      $("calcBadge").dataset.revision = String(state.rev);
      $("calPredWait").textContent = b.routeBlocked
        ? "막힘"
        : `${round(observed(b), 1)}초`;

      state.dirty = false;
      syncControls();
      drawAll();
    } catch (err) {
      state.dirty = false;
      const msg = err instanceof Error ? err.message : String(err);
      window.__errors.push(msg);
      state.results = null;
      drawAll();
    }
  }

  function queueRecompute(): void {
    state.dirty = true;
    window.clearTimeout(debounce);
    debounce = window.setTimeout(recompute, 50);
    drawAll();
  }

  function setPreset(kind: PresetKind): void {
    state.preset = kind;
    const found = SCENARIO_PRESETS.find((s) => s.id === kind);
    if (found) {
      if (kind === "staff") {
        state.plan = RehearsalCore.makeScene("baseline");
      } else {
        state.plan = RehearsalCore.makeScene("proposed");
        applyCategoryAndDesignToScene();
      }
      state.arrival = found.arrival;
      state.service = found.service;
      state.body = found.body;
      state.pickupStaff = found.pickupStaff;
    }
    state.selected = "display";
    $<HTMLInputElement>("arrivals").value = String(state.arrival);
    $<HTMLInputElement>("service").value = String(state.service);
    $<HTMLSelectElement>("bodyWidth").value = state.body.toFixed(2);
    $<HTMLInputElement>("pickupStaff").value = String(state.pickupStaff);
    recompute();
  }

  function setPosition(x: number, y: number, immediate = true): void {
    const o = getSelectedObject();
    if (!o) return;
    o.x = Math.max(
      0,
      Math.min(state.plan.width - o.w, Math.round(x * 10) / 10)
    );
    o.y = Math.max(
      0,
      Math.min(state.plan.height - o.h, Math.round(y * 10) / 10)
    );
    state.preset = "custom";
    syncControls();
    if (immediate) recompute();
    else queueRecompute();
  }

  // Top bar inputs
  $<HTMLInputElement>("addressInput").addEventListener("input", (e) => {
    state.address = (e.target as HTMLInputElement).value;
    syncControls();
  });

  document
    .querySelectorAll<HTMLButtonElement>(".hc-mini-chip[data-addr]")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        const addr = btn.getAttribute("data-addr")!;
        state.address = addr;
        $<HTMLInputElement>("addressInput").value = addr;
        document
          .querySelectorAll<HTMLButtonElement>(".hc-mini-chip[data-addr]")
          .forEach((b) => b.classList.toggle("active", b === btn));
        recompute();
      });
    });

  $<HTMLInputElement>("budgetSlider").addEventListener("input", (e) => {
    state.budgetManWon = Number((e.target as HTMLInputElement).value);
    renderCategoryCards();
    syncControls();
  });

  // House Control Toggles (Smart Lights + AC Airflow)
  $("toggleLightsBtn").addEventListener("click", () => {
    state.lightsOn = !state.lightsOn;
    syncControls();
    drawAll();
  });

  $("toggleAcBtn").addEventListener("click", () => {
    state.acOn = !state.acOn;
    syncControls();
    drawAll();
  });

  // Drawer open/close
  $("openDrawerBtn").addEventListener("click", () => {
    state.drawerOpen = !state.drawerOpen;
    $("studioDrawer").classList.toggle("hidden", !state.drawerOpen);
    if (state.drawerOpen) {
      window.setTimeout(drawBlueprintCanvas, 30);
    }
  });

  $("closeDrawerBtn").addEventListener("click", () => {
    state.drawerOpen = false;
    $("studioDrawer").classList.add("hidden");
  });

  // Fine sliders inside drawer
  $<HTMLInputElement>("arrivals").addEventListener("input", (e) => {
    state.arrival = Number((e.target as HTMLInputElement).value);
    state.preset = "custom";
    syncControls();
    queueRecompute();
  });

  $<HTMLInputElement>("service").addEventListener("input", (e) => {
    state.service = Number((e.target as HTMLInputElement).value);
    state.preset = "custom";
    syncControls();
    queueRecompute();
  });

  $<HTMLSelectElement>("bodyWidth").addEventListener("change", (e) => {
    state.body = Number((e.target as HTMLSelectElement).value);
    state.preset = "custom";
    recompute();
  });

  $<HTMLInputElement>("pickupStaff").addEventListener("input", (e) => {
    state.pickupStaff = Number((e.target as HTMLInputElement).value);
    state.preset = "custom";
    syncControls();
    queueRecompute();
  });

  $<HTMLInputElement>("displayX").addEventListener("change", (e) => {
    setPosition(
      Number((e.target as HTMLInputElement).value),
      getSelectedObject().y
    );
  });

  $<HTMLInputElement>("displayY").addEventListener("change", (e) => {
    setPosition(
      getSelectedObject().x,
      Number((e.target as HTMLInputElement).value)
    );
  });

  document
    .querySelectorAll<HTMLButtonElement>(".obj-chip[data-select-obj]")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-select-obj");
        if (id) {
          state.selected = id;
          syncControls();
          drawAll();
        }
      });
    });

  $("rotateObjBtn").addEventListener("click", () => {
    const o = getSelectedObject();
    if (!o || !o.movable) return;
    const nextW = o.h;
    const nextH = o.w;
    o.w = nextW;
    o.h = nextH;
    o.x = Math.max(0, Math.min(state.plan.width - o.w, o.x));
    o.y = Math.max(0, Math.min(state.plan.height - o.h, o.y));
    state.preset = "custom";
    recompute();
  });

  $("resetSceneBtn").addEventListener("click", () => {
    applyCategoryAndDesignToScene();
    recompute();
  });

  $("addBoothBtn").addEventListener("click", () => {
    const id = `custom-${state.rev + 1}`;
    state.plan.objects.push({
      id,
      label: "Pop-up booth",
      koLabel: "신규 매대",
      x: 5.2,
      y: 4.2,
      w: 1.6,
      h: 1.0,
      kind: "display",
      movable: true,
    });
    state.selected = id;
    state.preset = "custom";
    recompute();
  });

  $("removeCustomBtn").addEventListener("click", () => {
    state.plan.objects = state.plan.objects.filter(
      (o) => !o.id.startsWith("custom-") && !o.id.startsWith("manual-")
    );
    state.selected = "display";
    recompute();
  });

  // Playback
  $("playBtn").addEventListener("click", () => {
    if (state.t >= 600) state.t = 0;
    state.playing = !state.playing;
    syncControls();
  });

  $("restartBtn").addEventListener("click", () => {
    state.t = 0;
    state.playing = true;
    syncControls();
    drawAll();
  });

  $<HTMLInputElement>("timeline").addEventListener("input", (e) => {
    state.playing = false;
    state.t = Number((e.target as HTMLInputElement).value);
    syncControls();
    drawAll();
  });

  $<HTMLSelectElement>("speed").addEventListener("change", (e) => {
    state.speed = Number((e.target as HTMLSelectElement).value);
  });

  $("seedBtn").addEventListener("click", () => {
    state.seed += 73;
    recompute();
  });

  // Canvas Dragging
  canvases[1].style.cursor = "grab";

  canvases[1].addEventListener("keydown", (e) => {
    if (state.walkMode) return;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-0.2, 0],
      ArrowRight: [0.2, 0],
      ArrowUp: [0, -0.2],
      ArrowDown: [0, 0.2],
    };
    const d = moves[e.key];
    if (d) {
      e.preventDefault();
      const o = getSelectedObject();
      setPosition(o.x + d[0], o.y + d[1]);
    }
  });

  canvases[1].addEventListener("pointerdown", (e) => {
    if (!views[1]) return;
    const b = canvases[1].getBoundingClientRect();
    const pt = unproject(views[1], e.clientX - b.left, e.clientY - b.top);
    const hit = [...state.plan.objects]
      .reverse()
      .find(
        (a) =>
          a.movable &&
          pt.x >= a.x - 0.3 &&
          pt.x <= a.x + a.w + 0.3 &&
          pt.y >= a.y - 0.3 &&
          pt.y <= a.y + a.h + 0.3
      );
    if (hit) {
      state.selected = hit.id;
      drag = { id: hit.id, dx: pt.x - hit.x, dy: pt.y - hit.y };
      canvases[1].setPointerCapture(e.pointerId);
      canvases[1].style.cursor = "grabbing";
      syncControls();
      drawAll();
    }
  });

  canvases[1].addEventListener("pointermove", (e) => {
    if (!views[1]) return;
    const b = canvases[1].getBoundingClientRect();
    const pt = unproject(views[1], e.clientX - b.left, e.clientY - b.top);
    if (drag) {
      setPosition(pt.x - drag.dx, pt.y - drag.dy, false);
      return;
    }
    const hoverHit = [...state.plan.objects]
      .reverse()
      .find(
        (a) =>
          a.movable &&
          pt.x >= a.x - 0.25 &&
          pt.x <= a.x + a.w + 0.25 &&
          pt.y >= a.y - 0.25 &&
          pt.y <= a.y + a.h + 0.25
      );
    const nextHover = hoverHit ? hoverHit.id : null;
    if (nextHover !== state.hovered) {
      state.hovered = nextHover;
      canvases[1].style.cursor = nextHover ? "grab" : "default";
      drawAll();
    }
  });

  canvases[1].addEventListener("pointerup", () => {
    if (drag) {
      drag = null;
      canvases[1].style.cursor = "grab";
      recompute();
    }
  });

  // Walk Mode
  function stepWalkPlayer(dx: number, dy: number): void {
    if (!state.walkMode) {
      state.walkMode = true;
      state.playing = false;
      syncControls();
    }
    const accepted = ([state.base, state.plan] as const).map((scene, i) => {
      const target = {
        x: Math.round((state.players[i].x + dx) * 100) / 100,
        y: Math.round((state.players[i].y + dy) * 100) / 100,
      };
      if (canStand(scene, target, state.body)) {
        state.players[i] = target;
        return true;
      }
      return false;
    });
    $("walkHint").textContent = `기본:${accepted[0] ? "OK" : "막힘"} · 내도면:${
      accepted[1] ? "OK" : "막힘"
    }`;
    drawAll();
  }

  $("walkBtn").addEventListener("click", () => {
    state.walkMode = !state.walkMode;
    state.playing = false;
    state.players = [
      { ...state.base.entrance },
      { ...state.plan.entrance },
    ];
    syncControls();
    drawAll();
    if (state.walkMode) canvases[1].focus();
  });

  document
    .querySelectorAll<HTMLButtonElement>(".dpad-btn[data-move]")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        const dir = btn.getAttribute("data-move");
        if (dir === "up") stepWalkPlayer(0, -0.25);
        if (dir === "down") stepWalkPlayer(0, 0.25);
        if (dir === "left") stepWalkPlayer(-0.25, 0);
        if (dir === "right") stepWalkPlayer(0.25, 0);
      });
    });

  window.addEventListener("keydown", (e) => {
    const tag = (e.target as HTMLElement)?.tagName;
    if (
      !state.walkMode ||
      ["INPUT", "SELECT", "TEXTAREA"].includes(tag || "")
    ) {
      return;
    }
    const map: Record<string, [number, number]> = {
      ArrowUp: [0, -0.2],
      ArrowDown: [0, 0.2],
      ArrowLeft: [-0.2, 0],
      ArrowRight: [0.2, 0],
      w: [0, -0.2],
      s: [0, 0.2],
      a: [-0.2, 0],
      d: [0.2, 0],
    };
    const d = map[e.key];
    if (!d) return;
    e.preventDefault();
    stepWalkPlayer(d[0], d[1]);
  });

  // Export & Preview
  function summary(r: SimResult | undefined) {
    if (!r) return null;
    const { frames: _frames, ...s } = r;
    return s;
  }

  function packet() {
    return {
      product: "Rehearsal spatial studio",
      version: 2,
      address: state.address,
      budgetManWon: state.budgetManWon,
      category: state.categoryId,
      design: state.designId,
      calculationStatus: state.dirty
        ? "pending"
        : state.results
        ? "complete"
        : "error",
      revision: state.rev,
      baseline: {
        scene: state.base,
        config: getConfig(1),
        result: summary(state.results?.base),
      },
      proposal: {
        scene: state.plan,
        config: getConfig(state.pickupStaff),
        result: summary(state.results?.plan),
      },
    };
  }

  function downloadFile(name: string, text: string, type: string): void {
    const link = document.createElement("a");
    const url = URL.createObjectURL(new Blob([text], { type }));
    link.href = url;
    link.download = name;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  $("jsonBtn").addEventListener("click", () => {
    if (state.results) {
      downloadFile(
        "rehearsal-scenario.json",
        JSON.stringify(packet(), null, 2),
        "application/json"
      );
    }
  });

  $("exportBtn").addEventListener("click", () => {
    if (!state.results) return;
    downloadFile(
      "rehearsal-crew-plan.txt",
      buildCrewPlanText(),
      "text/plain;charset=utf-8"
    );
  });

  $("previewPlanBtn").addEventListener("click", () => {
    state.showPlanPreview = !state.showPlanPreview;
    $("planPreviewBox").classList.toggle("hidden", !state.showPlanPreview);
    if (state.showPlanPreview) {
      $("planPreviewText").textContent = buildCrewPlanText();
    }
  });

  // Blueprint Studio inside Drawer
  const ic = $<HTMLCanvasElement>("imageCanvas");

  function drawBlueprintCanvas(): void {
    const b = ic.getBoundingClientRect();
    const w = Math.max(b.width, 260);
    const h = Math.max(b.height, 150);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    ic.width = Math.round(w * dpr);
    ic.height = Math.round(h * dpr);
    const ctx = ic.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, w, h);

    if (!blueprintSource) return;

    const srcW = blueprintSource.width;
    const srcH = blueprintSource.height;
    const scale = Math.min(w / srcW, h / srcH);
    const dw = srcW * scale;
    const dh = srcH * scale;
    const dx = (w - dw) / 2;
    const dy = (h - dh) / 2;
    state.imageRect = { x: dx, y: dy, w: dw, h: dh };
    ctx.drawImage(blueprintSource, dx, dy, dw, dh);

    if (state.roi) {
      const a = state.roi;
      ctx.fillStyle = "rgba(52, 211, 153, 0.25)";
      ctx.fillRect(
        dx + a.left * dw,
        dy + a.top * dh,
        (a.right - a.left) * dw,
        (a.bottom - a.top) * dh
      );
      ctx.strokeStyle = "#34d399";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        dx + a.left * dw,
        dy + a.top * dh,
        (a.right - a.left) * dw,
        (a.bottom - a.top) * dh
      );
    }
  }

  function getNormalizedImagePoint(e: PointerEvent): Point2D {
    const b = ic.getBoundingClientRect();
    const r = state.imageRect || { x: 0, y: 0, w: b.width, h: b.height };
    return {
      x: Math.max(0, Math.min(1, (e.clientX - b.left - r.x) / r.w)),
      y: Math.max(0, Math.min(1, (e.clientY - b.top - r.y) / r.h)),
    };
  }

  function syncBoxState(): void {
    const r = state.roi;
    const valid =
      Boolean(r) &&
      r!.right - r!.left > 0.025 &&
      r!.bottom - r!.top > 0.025;
    $<HTMLButtonElement>("applyBox").disabled =
      !valid || !$<HTMLInputElement>("presenceConfirm").checked;
    if (r) {
      const mx = (r.left * 12).toFixed(1);
      const my = (r.top * 9).toFixed(1);
      const mw = ((r.right - r.left) * 12).toFixed(1);
      const mh = ((r.bottom - r.top) * 9).toFixed(1);
      $("imageStatus").textContent = `X=${mx}m, Y=${my}m (${mw}×${mh}m)`;
    }
  }

  $("loadSampleBlueprintBtn").addEventListener("click", () => {
    blueprintSource = generateSampleBlueprintCanvas();
    state.roi = { left: 0.36, top: 0.4, right: 0.61, bottom: 0.56 };
    drawBlueprintCanvas();
    syncBoxState();
  });

  $<HTMLInputElement>("imageFile").addEventListener("change", (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const next = new Image();
    next.onload = () => {
      URL.revokeObjectURL(url);
      blueprintSource = next;
      state.roi = null;
      drawBlueprintCanvas();
      syncBoxState();
    };
    next.src = url;
  });

  ic.addEventListener("pointerdown", (e) => {
    if (!blueprintSource) {
      blueprintSource = generateSampleBlueprintCanvas();
    }
    imageDrag = getNormalizedImagePoint(e);
    ic.setPointerCapture(e.pointerId);
  });

  ic.addEventListener("pointermove", (e) => {
    if (!imageDrag) return;
    const b = getNormalizedImagePoint(e);
    state.roi = {
      left: Math.min(imageDrag.x, b.x),
      right: Math.max(imageDrag.x, b.x),
      top: Math.min(imageDrag.y, b.y),
      bottom: Math.max(imageDrag.y, b.y),
    };
    drawBlueprintCanvas();
    syncBoxState();
  });

  ic.addEventListener("pointerup", () => {
    imageDrag = null;
    syncBoxState();
  });

  $<HTMLInputElement>("presenceConfirm").addEventListener(
    "change",
    syncBoxState
  );

  $("applyBox").addEventListener("click", () => {
    if ($<HTMLButtonElement>("applyBox").disabled || !state.roi) return;
    const r = state.roi;
    const id = `manual-${state.rev + 1}`;
    state.plan.objects.push({
      id,
      label: "Manual obstacle",
      koLabel: "도면 추가 매대",
      x: Math.round(r.left * 120) / 10,
      y: Math.round(r.top * 90) / 10,
      w: Math.max(0.4, Math.round((r.right - r.left) * 120) / 10),
      h: Math.max(0.4, Math.round((r.bottom - r.top) * 90) / 10),
      kind: "display",
      movable: true,
    });
    state.selected = id;
    state.preset = "custom";
    recompute();
    state.drawerOpen = false;
    $("studioDrawer").classList.add("hidden");
  });

  $("applyCalibrationBtn").addEventListener("click", () => {
    const obsArr = Number($<HTMLInputElement>("obsArrivalsInput").value);
    const obsWait = Number($<HTMLInputElement>("obsWaitInput").value);
    if (!Number.isFinite(obsArr) || !Number.isFinite(obsWait)) return;

    const predWait = observed(state.results?.plan) ?? 0;
    const diffSec = obsWait - predWait;
    state.arrival = Math.max(0, Math.min(8, Math.round(obsArr * 2) / 2));
    $<HTMLInputElement>("arrivals").value = String(state.arrival);
    if (Math.abs(diffSec) > 3) {
      const ratio = Math.max(
        0.7,
        Math.min(1.35, obsWait / Math.max(5, predWait))
      );
      state.service = Math.max(
        8,
        Math.min(45, Math.round(state.service * ratio))
      );
      $<HTMLInputElement>("service").value = String(state.service);
    }
    state.preset = "custom";
    recompute();
    $("calibrationResultBox").textContent = `실측 ${obsArr.toFixed(1)}명/분 · ${obsWait}초 보정 완료`;
  });

  function animate(now: number): void {
    const dt = last ? Math.min((now - last) / 1000, 0.2) : 0;
    last = now;
    if (state.playing) {
      state.t = Math.min(600, state.t + dt * state.speed);
      if (state.t >= 600) {
        state.playing = false;
        syncControls();
      }
    }
    if (++frameCounter % 2 === 0) {
      drawAll();
    }
    window.requestAnimationFrame(animate);
  }

  window.RehearsalApp = {
    getState: () => ({
      seed: state.seed,
      dirty: state.dirty,
      walkMode: state.walkMode,
      playerPositions: state.players.map((p) => ({ ...p })),
      revision: state.rev,
      config: getConfig(state.pickupStaff),
      scene: JSON.parse(JSON.stringify(state.plan)),
      results: state.results
        ? {
            base: summary(state.results.base),
            plan: summary(state.results.plan),
          }
        : null,
    }),
    packet,
    manualBox: () => state.roi,
  };

  blueprintSource = generateSampleBlueprintCanvas();
  state.roi = { left: 0.36, top: 0.4, right: 0.61, bottom: 0.56 };

  renderCategoryCards();
  renderDesignTabs();
  renderScenarioDeck();
  applyCategoryAndDesignToScene();

  new ResizeObserver(() => {
    drawAll();
    if (state.drawerOpen) drawBlueprintCanvas();
  }).observe(document.querySelector(".hc-stage")!);

  recompute();
  syncControls();
  syncBoxState();
  window.requestAnimationFrame(animate);
}

initStudio();
