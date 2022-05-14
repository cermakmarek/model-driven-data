import {
  DataSpecification,
  DataSpecificationArtefact,
  DataSpecificationDocumentation,
} from "../data-specification/model";
import { StreamDictionary } from "../io/stream/stream-dictionary";
import { writeBikeshed } from "./bikeshed-writer";
import { ArtefactGenerator, ArtefactGeneratorContext } from "../generator";
import { Bikeshed } from "./bikeshed-model";
import { assertFailed, LanguageString } from "../core";
import { specificationToBikeshed } from "./adapter/bikeshed-adapter";
import {
  ConceptualModelClass,
  ConceptualModelProperty,
} from "../conceptual-model";
import {
  StructureModel,
  StructureModelClass,
  StructureModelProperty,
} from "../structure-model/model/base";
import { BIKESHED } from "./bikeshed-vocabulary";

export class BikeshedGenerator implements ArtefactGenerator {
  identifier(): string {
    return BIKESHED.Generator;
  }

  async generateToStream(
    context: ArtefactGeneratorContext,
    artefact: DataSpecificationArtefact,
    specification: DataSpecification,
    output: StreamDictionary
  ) {
    const model = await this.generateToObject(context, artefact, specification);
    const stream = output.writePath(artefact.outputPath);
    await writeBikeshed(model, stream);
    await stream.close();
  }

  async generateToObject(
    context: ArtefactGeneratorContext,
    artefact: DataSpecificationArtefact,
    specification: DataSpecification
  ): Promise<Bikeshed> {
    if (DataSpecificationDocumentation.is(artefact)) {
      return await specificationToBikeshed(
        {
          generatorContext: context,
          selectString: selectString,
          selectOptionalString: selectOptionalString,
          sanitizeLink: sanitizeLink,
          conceptualClassAnchor: conceptualClassAnchor,
          conceptualPropertyAnchor: conceptualPropertyAnchor,
          structuralClassAnchor: createStructuralClassAnchor(context),
          structuralPropertyAnchor: createStructuralPropertyAnchor(context),
        },
        artefact,
        specification
      );
    } else {
      assertFailed(`'${artefact.iri}' is not of type documentation.`);
    }
  }

  async generateForDocumentation(): Promise<unknown | null> {
    // As of now documentation can not be included.
    return null;
  }
}

function selectString(value: LanguageString | null): string | null {
  // We define default here, so it is consistent across documentation.
  return selectOptionalString(value) ?? "nedefinováno";
}

function selectOptionalString(value: LanguageString | null): string | null {
  return value?.cs ?? value?.en ?? null;
}

function sanitizeLink(value): string {
  return value.replace(/ /g, "-").toLowerCase();
}

function conceptualClassAnchor(model: ConceptualModelClass): string {
  const label = selectString(model.humanLabel);
  return sanitizeLink("konceptuální-třída-" + label);
}

function conceptualPropertyAnchor(
  owner: ConceptualModelClass,
  property: ConceptualModelProperty
): string {
  const href = conceptualClassAnchor(owner);
  const label = selectString(property.humanLabel);
  return href + sanitizeLink("-" + label);
}

function createStructuralClassAnchor(context: ArtefactGeneratorContext) {
  return function structuralClassAnchor(
    format: string,
    structureModel: StructureModel,
    structureClass: StructureModelClass
  ): string {
    const modelLabel = selectString(structureModel.humanLabel);
    const classLabel = selectString(
      structureClass.humanLabel ??
        getConceptualClass(context, structureModel, structureClass)?.humanLabel
    );
    return sanitizeLink(
      `strukturální-${format}-${modelLabel}-třída-${classLabel}`
    );
  };
}

function getConceptualClass(
  context: ArtefactGeneratorContext,
  structureModel: StructureModel,
  structureClass: StructureModelClass
): ConceptualModelClass | null {
  for (const conceptualModel of Object.values(context.conceptualModels)) {
    const conceptualClass = conceptualModel.classes[structureClass.pimIri];
    if (conceptualClass !== undefined) {
      return conceptualClass;
    }
  }
  return null;
}

function createStructuralPropertyAnchor(context: ArtefactGeneratorContext) {
  const structuralClassAnchor = createStructuralClassAnchor(context);
  return function createStructuralPropertyAnchor(
    format: string,
    structureModel: StructureModel,
    structureClass: StructureModelClass,
    structureProperty: StructureModelProperty
  ): string {
    const href = structuralClassAnchor(format, structureModel, structureClass);
    // TODO we probably should also use humanLabel from PIM here as well.
    const label = selectString(structureProperty.humanLabel);
    return href + sanitizeLink("-" + label);
  };
}
