import { ConceptualModel } from "../../conceptual-model";
import { StructureModel } from "../model";
import { propagateCardinality } from "./propagate-cardinality";
import { structureModelAddCodelists } from "./add-codelists";
import { structureModelFlattenInheritance } from "./instantiate-properties";
import { structureModelDematerialize } from "./dematerialize";
import { propagateLabel } from "./propagate-label";
import { DataSpecification } from "../../data-specification/model";
import { addDataSpecification } from "./add-data-specification";

/**
 * Apply all transformations.
 */
export function transformStructureModel(
  conceptualModel: ConceptualModel,
  structureModel: StructureModel,
  specifications: DataSpecification[] | null = null
): StructureModel {
  let result = structureModel;
  // Conceptual level first.
  result = structureModelAddCodelists(conceptualModel, result);
  result = propagateCardinality(conceptualModel, result);
  result = structureModelAddCodelists(conceptualModel, result);
  result = propagateLabel(conceptualModel, result);
  // Next just structure transformations..
  result = structureModelFlattenInheritance(result);
  result = structureModelDematerialize(result);
  // Optional.
  if (specifications !== null) {
    result = addDataSpecification(result, specifications);
  }
  return result;
}