import {CoreResource} from "../../core";
import * as PSM from "../data-psm-vocabulary";

/**
 * Allow us to reference a class in another schema.
 */
export class DataPsmClassReference extends CoreResource {

  private static readonly TYPE = PSM.CLASS_REFERENCE;

  /**
   * IRI of external specification to load the definition from.
   */
  dataPsmSpecification: string | null = null;

  dataPsmClass: string | null = null;

  constructor(iri:string | null = null) {
    super(iri);
    this.types.push(DataPsmClassReference.TYPE);
  }

  static is(resource: CoreResource | null): resource is DataPsmClassReference {
    return resource?.types.includes(DataPsmClassReference.TYPE);
  }

}