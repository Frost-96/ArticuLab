import {
  getScenarioListAction,
  getSpeakingScenarioTypesAction,
  getWritingScenarioTypesAction,
} from "@/server/actions/scenario.action";

import * as scenarioService from "@/server/services/scenario.service";

console.log(
  await getScenarioListAction({ page: 1, pageSize: 5, category: "writing" }),
);
