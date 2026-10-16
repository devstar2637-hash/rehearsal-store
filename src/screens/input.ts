import type {
  Constraints,
  ExtendedRunResult,
  InputFixture,
  SourceTag,
  StoreDesign,
} from "../types.ts";
import {
  escapeHtml,
  formatKrw,
  formatNum,
  isUncalibrated,
  renderSourceChip,
} from "../format.ts";

export interface InputScreenCallbacks {
  onRun: (
    constraints: Constraints,
    baseDesign: StoreDesign
  ) => Promise<void> | void;
}

interface FieldSpec {
  key: string;
  koLabel: string;
  enLabel: string;
  value: number | string;
  formattedPreview: string;
  unit: string;
  step?: string;
  type: "number" | "text";
  group: "constraints" | "tagged" | "design";
  sourceTag: SourceTag & { note?: string };
}

export function renderInputScreen(
  container: HTMLElement,
  fixture: InputFixture,
  result: ExtendedRunResult,
  isRunning: boolean,
  callbacks: InputScreenCallbacks
): void {
  const c = fixture.constraints;
  const d = fixture.baseDesign;
  const tags = {
    ...fixture.sourceTags,
    ...(result.sourceTags ?? {}),
  };
  const uncalibrated = isUncalibrated(result);

  const fields: FieldSpec[] = [
    {
      key: "district",
      koLabel: "상권 구역",
      enLabel: "district",
      value: c.district,
      formattedPreview: c.district,
      unit: "구역",
      type: "text",
      group: "constraints",
      sourceTag: tags.district ?? tags.market,
    },
    {
      key: "trade",
      koLabel: "업종",
      enLabel: "trade",
      value: c.trade,
      formattedPreview: c.trade,
      unit: "업종",
      type: "text",
      group: "constraints",
      sourceTag: tags.trade ?? tags.market,
    },
    {
      key: "budgetKrw",
      koLabel: "가용 총예산",
      enLabel: "budgetKrw",
      value: c.budgetKrw,
      formattedPreview: formatKrw(c.budgetKrw),
      unit: "KRW",
      step: "1000000",
      type: "number",
      group: "constraints",
      sourceTag: tags.budgetKrw ?? {
        kind: "onsite",
        field: "budgetKrw",
        note: "가용 총현금",
      },
    },
    {
      key: "reserveRatioMin",
      koLabel: "최소 예비비 비율",
      enLabel: "reserveRatioMin",
      value: c.reserveRatioMin,
      formattedPreview: `${formatNum(c.reserveRatioMin)} (10%)`,
      unit: "ratio",
      step: "0.01",
      type: "number",
      group: "constraints",
      sourceTag: tags.reserveRatioMin ?? {
        kind: "computed",
        by: "oracle",
        field: "reserveRatioMin",
      },
    },
    {
      key: "horizonMonths",
      koLabel: "시뮬레이션 기간",
      enLabel: "horizonMonths",
      value: c.horizonMonths,
      formattedPreview: `${formatNum(c.horizonMonths)} months`,
      unit: "months",
      step: "1",
      type: "number",
      group: "constraints",
      sourceTag: tags.horizonMonths ?? {
        kind: "assumed",
        note: "36개월 고정",
      },
    },
    {
      key: "seed",
      koLabel: "재현 시드",
      enLabel: "seed",
      value: c.seed,
      formattedPreview: String(c.seed),
      unit: "seed",
      step: "1",
      type: "number",
      group: "constraints",
      sourceTag: tags.seed ?? {
        kind: "assumed",
        note: "고정 시드",
      },
    },
    // Tagged StoreDesign fields
    {
      key: "deposit",
      koLabel: "보증금 (만기 환급)",
      enLabel: "deposit",
      value: d.deposit.value,
      formattedPreview: formatKrw(d.deposit.value),
      unit: "KRW",
      step: "500000",
      type: "number",
      group: "tagged",
      sourceTag: d.deposit.source,
    },
    {
      key: "monthlyRent",
      koLabel: "월 임차료",
      enLabel: "monthlyRent",
      value: d.monthlyRent.value,
      formattedPreview: formatKrw(d.monthlyRent.value),
      unit: "KRW/mo",
      step: "50000",
      type: "number",
      group: "tagged",
      sourceTag: d.monthlyRent.source,
    },
    {
      key: "fitoutCost",
      koLabel: "초기 시설·장비비 합계",
      enLabel: "fitoutCost",
      value: d.fitoutCost.value,
      formattedPreview: formatKrw(d.fitoutCost.value),
      unit: "KRW",
      step: "500000",
      type: "number",
      group: "tagged",
      sourceTag: d.fitoutCost.source,
    },
    // Remaining StoreDesign fields
    {
      key: "seats",
      koLabel: "좌석 수",
      enLabel: "seats",
      value: d.seats,
      formattedPreview: `${formatNum(d.seats)} seats`,
      unit: "석",
      step: "1",
      type: "number",
      group: "design",
      sourceTag: tags.seats,
    },
    {
      key: "floorAreaM2",
      koLabel: "전용 면적",
      enLabel: "floorAreaM2",
      value: d.floorAreaM2,
      formattedPreview: `${formatNum(d.floorAreaM2)} m²`,
      unit: "m²",
      step: "0.5",
      type: "number",
      group: "design",
      sourceTag: tags.floorAreaM2,
    },
    {
      key: "staffFte",
      koLabel: "유급 직원 수",
      enLabel: "staffFte",
      value: d.staffFte,
      formattedPreview: `${formatNum(d.staffFte)} FTE`,
      unit: "FTE",
      step: "0.5",
      type: "number",
      group: "design",
      sourceTag: tags.staffFte,
    },
    {
      key: "ownerHoursPerWeek",
      koLabel: "점주 주당 근무시간",
      enLabel: "ownerHoursPerWeek",
      value: d.ownerHoursPerWeek,
      formattedPreview: `${formatNum(d.ownerHoursPerWeek)} hrs/wk`,
      unit: "hrs/wk",
      step: "1",
      type: "number",
      group: "design",
      sourceTag: tags.ownerHoursPerWeek,
    },
    {
      key: "menuTier",
      koLabel: "메뉴 구성 단계",
      enLabel: "menuTier",
      value: d.menuTier,
      formattedPreview: `Tier ${formatNum(d.menuTier)}`,
      unit: "1|2|3",
      step: "1",
      type: "number",
      group: "design",
      sourceTag: tags.menuTier,
    },
    {
      key: "avgTicketKrw",
      koLabel: "평균 객단가",
      enLabel: "avgTicketKrw",
      value: d.avgTicketKrw,
      formattedPreview: formatKrw(d.avgTicketKrw),
      unit: "KRW",
      step: "100",
      type: "number",
      group: "design",
      sourceTag: tags.avgTicketKrw,
    },
    {
      key: "makeTimeSec",
      koLabel: "음료 1잔 제조 시간",
      enLabel: "makeTimeSec",
      value: d.makeTimeSec,
      formattedPreview: `${formatNum(d.makeTimeSec)} sec`,
      unit: "sec",
      step: "1",
      type: "number",
      group: "design",
      sourceTag: tags.makeTimeSec,
    },
    {
      key: "openDaysPerWeek",
      koLabel: "주 영업일수",
      enLabel: "openDaysPerWeek",
      value: d.openDaysPerWeek,
      formattedPreview: `${formatNum(d.openDaysPerWeek)} days/wk`,
      unit: "days/wk",
      step: "1",
      type: "number",
      group: "design",
      sourceTag: tags.openDaysPerWeek,
    },
    {
      key: "equipmentKrw",
      koLabel: "장비 견적 (시설비 내 포함)",
      enLabel: "equipmentKrw",
      value: d.equipmentKrw ?? 20000000,
      formattedPreview: formatKrw(d.equipmentKrw ?? 20000000),
      unit: "KRW",
      step: "500000",
      type: "number",
      group: "design",
      sourceTag: tags.equipmentKrw,
    },
    {
      key: "cupsPerDayBase",
      koLabel: "일 기본 판매 잔수",
      enLabel: "cupsPerDayBase",
      value: d.cupsPerDayBase ?? 63.1,
      formattedPreview: `${formatNum(d.cupsPerDayBase ?? 63.1)} cups/day`,
      unit: "cups/day",
      step: "0.1",
      type: "number",
      group: "design",
      sourceTag: tags.cupsPerDayBase,
    },
    {
      key: "cogsRatio",
      koLabel: "매출원가율",
      enLabel: "cogsRatio",
      value: d.cogsRatio ?? 0.32,
      formattedPreview: `${formatNum(d.cogsRatio ?? 0.32)}`,
      unit: "ratio",
      step: "0.01",
      type: "number",
      group: "design",
      sourceTag: tags.cogsRatio,
    },
    {
      key: "openingMonth",
      koLabel: "개업 월",
      enLabel: "openingMonth",
      value: d.openingMonth ?? 3,
      formattedPreview: `${formatNum(d.openingMonth ?? 3)}월`,
      unit: "month (1-12)",
      step: "1",
      type: "number",
      group: "design",
      sourceTag: tags.openingMonth,
    },
    {
      key: "wagePerStaffKrw",
      koLabel: "직원 1인당 월 급여",
      enLabel: "wagePerStaffKrw",
      value: d.wagePerStaffKrw ?? 2400000,
      formattedPreview: formatKrw(d.wagePerStaffKrw ?? 2400000),
      unit: "KRW/FTE",
      step: "50000",
      type: "number",
      group: "design",
      sourceTag: tags.wagePerStaffKrw,
    },
    {
      key: "otherExpenseRatio",
      koLabel: "기타 영업비율",
      enLabel: "otherExpenseRatio",
      value: d.otherExpenseRatio ?? 0.06,
      formattedPreview: `${formatNum(d.otherExpenseRatio ?? 0.06)}`,
      unit: "ratio",
      step: "0.01",
      type: "number",
      group: "design",
      sourceTag: tags.otherExpenseRatio,
    },
  ];

  const renderFieldCard = (f: FieldSpec) => `
    <div class="input-field-card">
      <div class="input-field-card__header">
        <label for="field-${escapeHtml(f.key)}" class="input-field-card__label">
          <span class="input-field-card__ko">${escapeHtml(f.koLabel)}</span>
          <span class="input-field-card__en font-mono">(${escapeHtml(
            f.enLabel
          )})</span>
        </label>
        <span class="input-field-card__unit font-mono">${escapeHtml(
          f.unit
        )}</span>
      </div>
      <div class="input-field-card__control-row">
        <input
          id="field-${escapeHtml(f.key)}"
          name="${escapeHtml(f.key)}"
          type="${f.type}"
          ${f.step ? `step="${f.step}"` : ""}
          value="${escapeHtml(String(f.value))}"
          class="input-field-card__input font-mono"
        />
        <span class="input-field-card__preview font-mono">${escapeHtml(
          f.formattedPreview
        )}</span>
      </div>
      <div class="input-field-card__source">
        ${renderSourceChip(f.sourceTag, false)}
      </div>
    </div>
  `;

  container.innerHTML = `
    <section class="screen-section" id="screen-input" data-screen="input">
      <div class="screen-header">
        <div>
          <div class="screen-kicker">01. 입력 및 출처 검증 (Input & Source Tags · input.seongsu.json)</div>
          <h2 class="screen-title">
            기준 설계 및 상권 제약 입력 (StoreDesign & Constraints)
            ${
              uncalibrated
                ? `<span class="uncalibrated-inline-badge">미보정</span>`
                : ""
            }
          </h2>
          <p class="screen-subtitle">
            모든 입력 수치는 공공 데이터(public), 현장 실측(onsite), 오라클 산출(computed), 가정(assumed) 태그를 동반합니다.
            본 시뮬레이션은 <strong>rehearsal, not advice</strong> 원칙을 따르며 결과는 <strong>scenario frequency</strong>로만 집계됩니다.
          </p>
        </div>
        <div class="screen-header__actions">
          <button
            type="button"
            id="run-simulation-btn"
            class="btn-primary"
            ${isRunning ? "disabled" : ""}
          >
            ${isRunning ? "Running..." : "Run"}
          </button>
        </div>
      </div>

      <div class="market-banner">
        <div class="market-banner__item">
          <span class="market-banner__label">공공 상권 데이터셋 (market)</span>
          ${renderSourceChip(tags.market, false)}
        </div>
        <div class="market-banner__item">
          <span class="market-banner__label">계절성 지수 (seasonality · 12개월)</span>
          <span class="font-mono text-xs">${escapeHtml(
            (result.seasonality ?? [0.86, 0.88, 0.98, 1.05, 1.1, 1.08, 1.04, 1.02, 1.06, 1.09, 0.96, 0.88]).join(
              ", "
            )
          )}</span>
          ${renderSourceChip(tags.seasonality, false)}
        </div>
      </div>

      <form id="store-input-form" class="input-form-grid" novalidate>
        <div class="input-group-block">
          <h3 class="input-group-title">상권 및 예산 제약 (Constraints)</h3>
          <div class="input-cards-grid">
            ${fields
              .filter((f) => f.group === "constraints")
              .map(renderFieldCard)
              .join("")}
          </div>
        </div>

        <div class="input-group-block">
          <h3 class="input-group-title">현장 임차·시공 원가 (Tagged StoreDesign Costs)</h3>
          <div class="input-cards-grid">
            ${fields
              .filter((f) => f.group === "tagged")
              .map(renderFieldCard)
              .join("")}
          </div>
        </div>

        <div class="input-group-block">
          <h3 class="input-group-title">점포 운영 및 설계 변수 (StoreDesign Operations · id: <span class="font-mono">${escapeHtml(
            d.id
          )}</span>)</h3>
          <div class="input-cards-grid">
            ${fields
              .filter((f) => f.group === "design")
              .map(renderFieldCard)
              .join("")}
          </div>
        </div>
      </form>
    </section>
  `;

  const runBtn = container.querySelector<HTMLButtonElement>(
    "#run-simulation-btn"
  );
  const formEl = container.querySelector<HTMLFormElement>("#store-input-form");

  const collectAndRun = () => {
    if (!formEl) return;
    const fd = new FormData(formEl);
    const num = (key: string, fallback: number): number => {
      const raw = fd.get(key);
      if (raw === null || raw === "") return fallback;
      const parsed = Number(raw);
      return Number.isFinite(parsed) ? parsed : fallback;
    };
    const str = (key: string, fallback: string): string => {
      const raw = fd.get(key);
      return typeof raw === "string" && raw.trim().length > 0
        ? raw.trim()
        : fallback;
    };

    const nextConstraints: Constraints = {
      budgetKrw: num("budgetKrw", c.budgetKrw),
      reserveRatioMin: num("reserveRatioMin", c.reserveRatioMin),
      horizonMonths: 36,
      district: str("district", c.district),
      trade: "cafe",
      seed: num("seed", c.seed),
    };

    const menuTierRaw = num("menuTier", d.menuTier);
    const menuTier: 1 | 2 | 3 =
      menuTierRaw === 1 ? 1 : menuTierRaw === 3 ? 3 : 2;

    const nextDesign: StoreDesign = {
      ...d,
      seats: num("seats", d.seats),
      floorAreaM2: num("floorAreaM2", d.floorAreaM2),
      deposit: {
        value: num("deposit", d.deposit.value),
        source: d.deposit.source,
      },
      monthlyRent: {
        value: num("monthlyRent", d.monthlyRent.value),
        source: d.monthlyRent.source,
      },
      fitoutCost: {
        value: num("fitoutCost", d.fitoutCost.value),
        source: d.fitoutCost.source,
      },
      staffFte: num("staffFte", d.staffFte),
      ownerHoursPerWeek: num("ownerHoursPerWeek", d.ownerHoursPerWeek),
      menuTier,
      avgTicketKrw: num("avgTicketKrw", d.avgTicketKrw),
      makeTimeSec: num("makeTimeSec", d.makeTimeSec),
      openDaysPerWeek: num("openDaysPerWeek", d.openDaysPerWeek),
      equipmentKrw: num("equipmentKrw", d.equipmentKrw ?? 20000000),
      cupsPerDayBase: num("cupsPerDayBase", d.cupsPerDayBase ?? 63.1),
      cogsRatio: num("cogsRatio", d.cogsRatio ?? 0.32),
      openingMonth: num("openingMonth", d.openingMonth ?? 3),
      wagePerStaffKrw: num("wagePerStaffKrw", d.wagePerStaffKrw ?? 2400000),
      otherExpenseRatio: num(
        "otherExpenseRatio",
        d.otherExpenseRatio ?? 0.06
      ),
    };

    callbacks.onRun(nextConstraints, nextDesign);
  };

  if (runBtn) {
    runBtn.addEventListener("click", collectAndRun);
  }
  if (formEl) {
    formEl.addEventListener("submit", (e) => {
      e.preventDefault();
      collectAndRun();
    });
  }
}
