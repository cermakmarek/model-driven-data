import {
  BikeshedContent,
  BikeshedContentList,
  BikeshedContentListItem,
  BikeshedContentSection,
  BikeshedContentText,
  BikeshedAdapterArtefactContext,
} from "@dataspecer/bikeshed";
import {
  StructureModelClass,
  StructureModelComplexType,
  StructureModelProperty,
} from "@dataspecer/core/structure-model/model";
import { assertNot } from "@dataspecer/core/core";
import { OFN_LABELS } from "@dataspecer/core/well-known";
import {
  ConceptualModel,
  ConceptualModelClass,
  ConceptualModelProperty,
} from "@dataspecer/core/conceptual-model";
import {
  DataSpecificationArtefact,
  DataSpecificationDocumentation,
} from "@dataspecer/core/data-specification/model";
import {pathRelative} from "@dataspecer/core/core/utilities/path-relative";

export async function createBikeshedSchemaJson(
  context: BikeshedAdapterArtefactContext
): Promise<BikeshedContent> {
  const structureModel = context.structureModel;
  const label = context.selectString(structureModel.humanLabel) + " JSON";
  const result = new BikeshedContentSection(label, null);

  const linkToSchema = pathRelative(
    context.ownerArtefact.publicUrl,
    context.artefact.publicUrl
  );
  result.content.push(
    new BikeshedContentText(
      `Tato sekce je dokumentací pro [JSON schéma](${linkToSchema}).`
    )
  );

  for (const entity of structureModel.getClasses()) {
    if ((entity.structureSchema !== context.structureModel.psmIri) || entity.isReferenced) {
      // Class is not from this structure model.
      continue;
    }
    result.content.push(createEntitySection(context, entity));
  }
  return result;
}

function createEntitySection(
  context: BikeshedAdapterArtefactContext,
  entity: StructureModelClass
): BikeshedContent {
  const result = new BikeshedContentSection(
    classLabel(context, entity),
    classAnchor(context, entity)
  );

  const properties = new BikeshedContentList();
  result.content.push(properties);
  const description = context.selectOptionalString(entity.humanDescription);
  if (description !== null) {
    properties.items.push(
      new BikeshedContentListItem(
        context.selectString({
          cs: "Popis",
          en: "Description",
        }),
        [description]
      )
    );
  }
  if (entity.isCodelist) {
    properties.items.push(
      new BikeshedContentListItem("Číselník", ["Typ reprezentuje číselník."])
    );
  }
  properties.items.push(
    new BikeshedContentListItem("Interpretace", [
      classInterpretation(context, entity),
    ])
  );

  entity.properties
    .filter((item) => isAttribute(item))
    .map((item) => createPropertySection(context, entity, item))
    .forEach((item) => result.content.push(item));

  entity.properties
    .filter((item) => !isAttribute(item))
    .map((item) => createPropertySection(context, entity, item))
    .forEach((item) => result.content.push(item));

  return result;
}

function classLabel(
  context: BikeshedAdapterArtefactContext,
  model: StructureModelClass
): string {
  return context.selectString(model.humanLabel);
}

function classAnchor(
  context: BikeshedAdapterArtefactContext,
  entity: StructureModelClass
): string {
  return context.structuralClassAnchor("json", context.structureModel, entity);
}

function classInterpretation(
  context: BikeshedAdapterArtefactContext,
  entity: StructureModelClass
): string {
  if (entity.pimIri === null) {
    return "Bez interpretace.";
  }
  const conceptualClass = context.conceptualModel.classes[entity.pimIri];
  assertNot(
    conceptualClass === undefined,
    `Missing conceptual class ${entity.pimIri} for ${entity.psmIri}`
  );
  const label = context.selectString(conceptualClass.humanLabel);
  const href = context.conceptualClassAnchor(conceptualClass);
  return `[${label}](#${href})`;
}

function isAttribute(property: StructureModelProperty): boolean {
  for (const type of property.dataTypes) {
    if (type.isAssociation()) {
      return false;
    }
  }
  return true;
}

function createPropertySection(
  context: BikeshedAdapterArtefactContext,
  entity: StructureModelClass,
  property: StructureModelProperty
): BikeshedContent {
  const label = propertyLabel(context, property);
  let heading;
  if (isAttribute(property)) {
    heading = label;
  } else {
    heading = "Vztah: " + label;
  }

  const result = new BikeshedContentSection(
    heading,
    propertyAnchor(context, entity, property)
  );

  const list = new BikeshedContentList();
  result.content.push(list);
  list.items.push(
    new BikeshedContentListItem("Klíč", [property.technicalLabel])
  );
  list.items.push(new BikeshedContentListItem("Jméno", [label]));
  const description = context.selectString(
    context.structureModel.humanDescription
  );
  if (description !== null) {
    list.items.push(new BikeshedContentListItem("Popis", [description]));
  }
  list.items.push(
    new BikeshedContentListItem("Povinnost", [
      isOptional(property) ? "Nepovinná" : "Povinná",
    ])
  );
  list.items.push(
    new BikeshedContentListItem("Kardinalita", [propertyCardinality(property)])
  );
  list.items.push(
    new BikeshedContentListItem("Typ", propertyTypes(context, property))
  );
  if (entity.psmIri !== null) {
    list.items.push(
      new BikeshedContentListItem("Interpretace", [
        propertyInterpretation(context, entity, property),
      ])
    );
  }
  return result;
}

function propertyLabel(
  context: BikeshedAdapterArtefactContext,
  property: StructureModelProperty
): string {
  return context.selectString(property.humanLabel);
}

function propertyAnchor(
  context: BikeshedAdapterArtefactContext,
  entity: StructureModelClass,
  property: StructureModelProperty
): string {
  return context.structuralPropertyAnchor(
    "json",
    context.structureModel,
    entity,
    property
  );
}

function isOptional(model: StructureModelProperty): boolean {
  return model.cardinalityMin === null || model.cardinalityMin === 0;
}

function propertyCardinality(property: StructureModelProperty) {
  let result = "";
  if (property.cardinalityMin === null) {
    result += "0";
  } else {
    result += String(property.cardinalityMin);
  }
  result += " - ";
  if (property.cardinalityMax === null) {
    result += "&infin;";
  } else {
    result += String(property.cardinalityMax);
  }
  return result;
}

function propertyInterpretation(
  context: BikeshedAdapterArtefactContext,
  entity: StructureModelClass,
  property: StructureModelProperty
): string {
  if (entity.pimIri === null || property.pimIri === null) {
    return "Bez interpretace.";
  } else if (property.pathToOrigin.length > 0) {
    // TODO Dematerialized property
    return "";
  }

  const conceptualClass = context.conceptualModel.classes[entity.pimIri];
  assertNot(
    conceptualClass === undefined,
    `Missing conceptual entity ${entity.pimIri} for` +
      `structure entity ${entity.psmIri} .`
  );

  const reference = findConceptualPropertyInHierarchy(
    context.conceptualModel,
    conceptualClass,
    property.pimIri
  );

  assertNot(
    reference === null,
    `Missing conceptual property ${property.pimIri} in entity ${entity.pimIri} .` +
      ` For structure property ${property.psmIri}`
  );

  const label = context.selectString(reference.property.humanLabel);
  const href = context.conceptualPropertyAnchor(
    reference.owner,
    reference.property
  );
  return `[${label}](#${href})`;
}

/**
 * The given property can be declared not only in a given class but
 * also in any class it extends.
 */
function findConceptualPropertyInHierarchy(
  conceptualModel: ConceptualModel,
  conceptualClass: ConceptualModelClass,
  propertyIri: string
): {
  owner: ConceptualModelClass;
  property: ConceptualModelProperty;
} | null {
  // Searching for ancestors.
  const searchStack = [conceptualClass];
  while (searchStack.length > 0) {
    const next = searchStack.pop();
    for (const candidateProperty of next.properties) {
      if (candidateProperty.pimIri === propertyIri) {
        return {
          owner: next,
          property: candidateProperty,
        };
      }
    }
    searchStack.push(...next.extends);
  }
  return null;
}

function propertyTypes(
  context: BikeshedAdapterArtefactContext,
  property: StructureModelProperty
): string[] {
  if (property.dataTypes.length === 0) {
    return [];
  }
  const result = [];
  for (const type of property.dataTypes) {
    if (type.isAssociation()) {
      result.push(propertyTypeAssociation(context, type));
    } else if (type.isAttribute()) {
      const ofn = OFN_LABELS[type.dataType];
      let label;
      if (ofn === undefined) {
        label = type.dataType;
      } else {
        label = context.selectString(ofn);
      }
      result.push(`[${label}](${type.dataType})`);
    }
  }
  return result;
}

function propertyTypeAssociation(
  context: BikeshedAdapterArtefactContext,
  type: StructureModelComplexType
): string {
  const target = type.dataType;
  if (target === null) {
    throw new Error("Specification re-use is not supported.");
  }
  if (context.structureModel.psmIri === target.structureSchema && !target.isReferenced) {
    const label = classLabel(context, target);
    const href = classAnchor(context, target);
    return `[${label}](#${href})`;
  }
  return externalAssociation(context, target);
}

function externalAssociation(
  context: BikeshedAdapterArtefactContext,
  structureClass: StructureModelClass
): string {
  const structureModel =
    context.generatorContext.structureModels[structureClass.structureSchema];
  assertNot(structureModel === undefined, "Missing structure model.");
  const specification =
    context.generatorContext.specifications[structureClass.specification];
  assertNot(specification === undefined, "Missing specification.");
  const conceptualModel =
    context.generatorContext.conceptualModels[specification.pim];
  assertNot(conceptualModel === undefined, "Missing conceptual model.");
  const conceptualClass = conceptualModel.classes[structureClass.pimIri];
  assertNot(conceptualClass === undefined, "Missing conceptual class.");
  //
  let artefact: DataSpecificationArtefact = null;
  for (const artefactInSpecification of specification.artefacts) {
    // TODO This is naive approach, there can be multiple specifications.
    // We need to look for specification of given type, then find the
    // documentation that includes it and then use that artefact.
    if (DataSpecificationDocumentation.is(artefactInSpecification)) {
      artefact = artefactInSpecification;
      break;
    }
  }
  // Manual label propagation.
  const label = context.selectString(
    structureClass.humanLabel ?? conceptualClass.humanLabel
  );
  if (artefact == null) {
    return label;
  } else {
    const url =
      artefact.publicUrl +
      "#" +
      context.structuralClassAnchor("json", structureModel, structureClass);
    return `[${label}](${url})`;
  }
}
