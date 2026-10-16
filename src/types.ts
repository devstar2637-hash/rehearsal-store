import type {
  Constraints,
  StoreDesign,
  SourceTag,
  RunResult,
} from "../shared/types.ts";

export * from "../shared/types.ts";

export interface InputFixture {
  constraints: Constraints;
  baseDesign: StoreDesign;
  sourceTags: Record<string, SourceTag & { note?: string }>;
  inputFiles: string[];
}

export interface ExtendedRunResult extends RunResult {
  distributionsHidden?: boolean;
  seasonality?: number[];
  sourceTags?: Record<string, SourceTag & { note?: string }>;
  _note?: string;
}
