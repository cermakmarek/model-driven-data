import {RdfObject, RdfSourceWrap} from "../../core/adapter/rdf";
import {PimResource} from "../../platform-independent-model/model";
import {LanguageString} from "../../core";
import {SKOS} from "../sgov-vocabulary";
import {IdProvider} from "../../cim/id-provider";

// todo move
function RdfObjectsToLanguageString(objects: RdfObject[]): LanguageString {
  return Object.fromEntries(objects.map(o => [o.language, o.value]));
}

export async function loadSgovEntity(entity: RdfSourceWrap, idProvider: IdProvider): Promise<PimResource> {
  const resource: PimResource = {types: []};

  // skos:prefLabel
  const prefLabel = await entity.property(SKOS.prefLabel);
  resource.pimHumanLabel = RdfObjectsToLanguageString(prefLabel);

  // skos:definition
  const definition = await entity.property(SKOS.definition);
  resource.pimHumanDescription = RdfObjectsToLanguageString(definition);

  // interpretation
  resource.pimInterpretation = entity.id();

  // id
  resource.iri = idProvider.cimToPim(resource.pimInterpretation);

  return resource;
}
