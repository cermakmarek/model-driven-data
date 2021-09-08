import {CoreResource} from "../../core";
import {PimResource} from "./pim-resource";

/**
 * Specify one end of the association that points to a class.
 */
export interface PimAssociationEnd extends PimResource {

  pimPart?: string;

}

const PimAssociationEndType = "pim-association-end";

export function isPimAssociationEnd(
  resource: CoreResource | null,
): resource is PimAssociationEnd {
  return resource !== null
    && resource.types.includes(PimAssociationEndType);
}

export function asPimAssociationEnd(resource: CoreResource): PimAssociationEnd {
  if (isPimAssociationEnd(resource)) {
    return resource as PimAssociationEnd;
  }
  resource.types.push(PimAssociationEndType);
  return resource as PimAssociationEnd;
}