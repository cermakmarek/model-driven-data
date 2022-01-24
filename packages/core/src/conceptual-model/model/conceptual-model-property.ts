import {ConceptualModelType} from "./conceptual-model-type";
import {LanguageString} from "../../core";

export class ConceptualModelProperty {

  pimIri: string | null = null;

  cimIri: string | null = null;

  humanLabel: LanguageString | null = null;

  humanDescription: LanguageString | null = null;

  cardinalityMin: number | null = null;

  cardinalityMax: number | null = null;

  dataTypes: ConceptualModelType[] = [];

}