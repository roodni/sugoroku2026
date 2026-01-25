import type { Scenario } from "../../scenario";
import { spaceMap } from "./space/space";
import { generateTurn } from "./turn";

export const scenarioV1: Scenario = {
  spaceMap,
  generateTurn,
};
