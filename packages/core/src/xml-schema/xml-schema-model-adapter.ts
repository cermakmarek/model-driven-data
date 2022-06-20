import {
  StructureModelClass,
  StructureModelPrimitiveType,
  StructureModelProperty,
  StructureModelType,
  StructureModelComplexType, StructureModelSchemaRoot,
} from "../structure-model/model";

import {
  XmlStructureModel as StructureModel
} from "../xml-structure-model/model/xml-structure-model";

import {
  XmlSchema,
  XmlSchemaComplexContent,
  XmlSchemaComplexContentElement,
  XmlSchemaComplexContentItem,
  XmlSchemaComplexGroup,
  XmlSchemaComplexType,
  XmlSchemaComplexItem,
  XmlSchemaElement,
  XmlSchemaSimpleType,
  XmlSchemaType,
  xmlSchemaTypeIsComplex,
  XmlSchemaImportDeclaration,
  XmlSchemaGroupDefinition,
  XmlSchemaAnnotation,
  XmlSchemaComplexSequence,
  XmlSchemaComplexChoice,
  XmlSchemaComplexExtension,
} from "./xml-schema-model";

import {
  DataSpecification,
  DataSpecificationArtefact,
  DataSpecificationSchema,
} from "../data-specification/model";

import { XSD } from "../well-known";
import { XML_SCHEMA } from "./xml-schema-vocabulary";

import { commonXmlPrefix, iriElementName, langStringName, QName, simpleTypeMapQName } from "../xml/xml-conventions";
import { pathRelative } from "../core/utilities/path-relative";
import { structureModelAddXmlProperties } from "../xml-structure-model/add-xml-properties";
import { ArtefactGeneratorContext } from "../generator";

export function structureModelToXmlSchema(
  context: ArtefactGeneratorContext,
  specification: DataSpecification,
  artifact: DataSpecificationSchema,
  model: StructureModel
): XmlSchema {
  const options = XmlSchemaAdapterOptions.getFromConfiguration(artifact.configuration);
  const adapter = new XmlSchemaAdapter(
    context, specification, artifact, model, options
  );
  return adapter.fromRoots(model.roots);
}

class ExtractOptions {
  extractType: boolean;
  extractGroup: boolean;
}

export class XmlSchemaAdapterOptions {
  rootClass: ExtractOptions;
  otherClasses: ExtractOptions;

  constructor() {
    this.rootClass = new ExtractOptions();
    this.otherClasses = new ExtractOptions();
  }

  static getFromConfiguration(configuration: Partial<XmlSchemaAdapterOptions>): XmlSchemaAdapterOptions {
    const options = new XmlSchemaAdapterOptions();
    if (configuration?.rootClass) {
      options.rootClass.extractType = !!configuration?.rootClass?.extractType ?? true;
      options.rootClass.extractGroup = !!configuration?.rootClass?.extractGroup ?? false;
    }
    if (configuration?.otherClasses) {
      options.otherClasses.extractType = !!configuration?.otherClasses?.extractType ?? false;
      options.otherClasses.extractGroup = !!configuration?.otherClasses?.extractGroup ?? false;
    }
    return options;
  }
}

const anyUriType: StructureModelPrimitiveType = (function () {
  const type = new StructureModelPrimitiveType();
  type.dataType = XSD.anyURI;
  return type;
})();

const xsdNamespace = "http://www.w3.org/2001/XMLSchema#";

const iriProperty: XmlSchemaComplexContentElement = {
  cardinalityMin: 0,
  cardinalityMax: 1,
  element: {
    elementName: iriElementName,
    annotation: null,
    type: null
  }
};

class XmlSchemaAdapter {
  private usesLangString: boolean;
  private context: ArtefactGeneratorContext;
  private specifications: { [iri: string]: DataSpecification };
  private specification: DataSpecification;
  private artifact: DataSpecificationSchema;
  private model: StructureModel;
  private options: XmlSchemaAdapterOptions;

  constructor(
    context: ArtefactGeneratorContext,
    specification: DataSpecification,
    artifact: DataSpecificationSchema,
    model: StructureModel,
    options: XmlSchemaAdapterOptions
  ) {
    this.context = context;
    this.specifications = context.specifications;
    this.specification = specification;
    this.artifact = artifact;
    this.model = model;
    this.options = options;
  }
  
  private imports: { [specification: string]: XmlSchemaImportDeclaration };
  private groups: Record<string, XmlSchemaGroupDefinition>;
  private types: Record<string, XmlSchemaType>;

  public fromRoots(roots: StructureModelSchemaRoot[]): XmlSchema {
    this.imports = {};
    this.groups = {};
    this.types = {};
    const elements = roots
      .flatMap(root => root.classes)
      .map(this.classToElement, this)
      .map(this.extractGroupFromRoot, this)
      .map(this.extractTypeFromRoot, this);
    return {
      targetNamespace: this.model.namespace,
      targetNamespacePrefix: this.model.namespacePrefix,
      elements: elements,
      defineLangString: this.usesLangString,
      imports: Object.values(this.imports),
      groups: Object.values(this.groups),
      types: Object.values(this.types),
    };
  }

  extractGroupFromRoot(
    element: XmlSchemaElement
  ): XmlSchemaElement {
    if (
      this.options.rootClass.extractGroup &&
      xmlSchemaTypeIsComplex(element.type)
    ) {
      const groupName = element.elementName[1];
      this.groups[groupName] = {
        name: groupName,
        contents: [
          {
            item: element.type.complexDefinition,
            cardinalityMin: 1,
            cardinalityMax: 1,
          } as XmlSchemaComplexContentItem,
        ],
      };

      return {
        elementName: element.elementName,
        type: {
          name: element.type.name,
          annotation: element.type.annotation,
          mixed: false,
          abstract: false,
          complexDefinition: {
            xsType: "group",
            name: [this.model.namespacePrefix, groupName],
            contents: [],
          } as XmlSchemaComplexGroup,
        } as XmlSchemaComplexType,
        annotation: element.annotation,
      };
    }
    return element;
  }

  extractTypeFromRoot(
    element: XmlSchemaElement
  ): XmlSchemaElement {
    if (this.options.rootClass.extractType) {
      const typeName = element.elementName[1];
      const type = element.type;
      type.name = [null, typeName];
      this.types[typeName] = type;

      return {
        elementName: element.elementName,
        type: {
          name: [this.model.namespacePrefix, typeName],
          annotation: null
        },
        annotation: element.annotation,
      };
    }
    return element;
  }

  findArtefactForImport(
    classData: StructureModelClass
  ): DataSpecificationArtefact | null {
    const targetSpecification = this.specifications[classData.specification];
    if (targetSpecification == null) {
      throw new Error(`Missing specification ${classData.specification}`);
    }
    for (const candidate of targetSpecification.artefacts) {
      if (candidate.generator !== XML_SCHEMA.Generator) {
        continue;
      }
      const candidateSchema = candidate as DataSpecificationSchema;
      if (classData.structureSchema !== candidateSchema.psm) {
        continue;
      }
      // TODO We should check that the class is root here.
      return candidate;
    }
    return null;
  }

  classIsImported(
    classData: StructureModelClass
  ): boolean {
    return this.model.psmIri !== classData.structureSchema;
  }

  currentPath(): string {
    return this.artifact.publicUrl;
  }

  resolveImportedElementName(
    classData: StructureModelClass
  ): QName | Promise<QName> {
    if (this.model.psmIri !== classData.structureSchema) {
      const importDeclaration = this.imports[classData.specification];
      if (importDeclaration != null) {
        return this.getQName(importDeclaration.prefix, classData.technicalLabel);
      }
      const artefact = this.findArtefactForImport(classData);
      if (artefact != null) {
        const model = this.getImportedModel(classData.structureSchema);
        const imported = this.imports[classData.specification] = {
          namespace: this.getModelNamespace(model),
          prefix: this.getModelPrefix(model),
          schemaLocation: pathRelative(this.currentPath(), artefact.publicUrl),
        };
        return this.getQName(imported.prefix, classData.technicalLabel);
      }
    }
    return [null, classData.technicalLabel];
  }

  async getQName(
    prefix: Promise<string>,
    name: string
  ): Promise<QName> {
    return [await prefix, name];
  }

  async getImportedModel(
    iri: string
  ): Promise<StructureModel> {
    const model = this.context.structureModels[iri];
    if (model != null) {
      return await structureModelAddXmlProperties(
        model, this.context.reader
      );
    }
    return null;
  }

  async getModelNamespace(model: Promise<StructureModel>) {
    return (await model)?.namespace;
  }

  async getModelPrefix(model: Promise<StructureModel>) {
    return (await model)?.namespacePrefix;
  }

  getAnnotation(
    data: StructureModelClass | StructureModelProperty
  ): XmlSchemaAnnotation {
    const lines = [];
    if (data.cimIri != null) {
      lines.push(`Význam: ${data.cimIri}`);
    }
    if (data.humanLabel != null) {
      for (const lang of Object.keys(data.humanLabel)) {
        lines.push(`Název (${lang}): ${data.humanLabel[lang]}`);
      }
    }
    if (data.humanDescription != null) {
      for (const lang of Object.keys(data.humanDescription)) {
        lines.push(`Popis (${lang}): ${data.humanDescription[lang]}`);
      }
    }
    return lines.length == 0 ? null : {
      modelReference: data.cimIri,
      documentation: lines.join("\n")
    }
  }

  classToElement(classData: StructureModelClass): XmlSchemaElement {
    return {
      elementName: this.resolveImportedElementName(classData),
      type: {
        name: null,
        complexDefinition: this.classToComplexType(classData),
        annotation: this.getAnnotation(classData),
      } as XmlSchemaComplexType,
      annotation: null,
    };
  }

  classToComplexType(
    classData: StructureModelClass,
    extractGroup?: boolean,
    skipIri?: boolean
  ): XmlSchemaComplexItem {
    if (this.classIsImported(classData)) {
      return {
        xsType: "group",
        name: this.resolveImportedElementName(classData),
      } as XmlSchemaComplexGroup;
    }
    const contents = classData.properties.map(
      this.propertyToComplexContent, this
    );
    if (!skipIri) contents.splice(0, 0, iriProperty);
    if (extractGroup && this.options.otherClasses.extractGroup) {
      const groupName = classData.technicalLabel;

      this.groups[groupName] = {
        name: groupName,
        contents: contents,
      };

      return {
        xsType: "group",
        name: [this.model.namespacePrefix, groupName],
        contents: [],
      } as XmlSchemaComplexGroup;
    }
    return {
      xsType: "sequence",
      contents: contents,
    } as XmlSchemaComplexSequence;
  }

  propertyToComplexContent(
    propertyData: StructureModelProperty
  ): XmlSchemaComplexContent {
    const elementContent: XmlSchemaComplexContentElement = {
      cardinalityMin: propertyData.cardinalityMin ?? 0,
      cardinalityMax: propertyData.cardinalityMax,
      element: this.propertyToElement(propertyData),
    };
    if (propertyData.dematerialize) {
      const type = elementContent.element.type;
      if (xmlSchemaTypeIsComplex(type)) {
        return {
          cardinalityMin: elementContent.cardinalityMin,
          cardinalityMax: elementContent.cardinalityMax,
          item: type.complexDefinition,
        } as XmlSchemaComplexContentItem;
      } else {
        throw new Error(
          `Property ${propertyData.psmIri} must be of a class type ` +
            "if specified as non-materialized."
        );
      }
    }
    return elementContent;
  }

  propertyToElement(propertyData: StructureModelProperty): XmlSchemaElement {
    let dataTypes = propertyData.dataTypes;
    if (dataTypes.length === 0) {
      throw new Error(
        `Property ${propertyData.psmIri} has no specified types.`
      );
    }
    // Treat codelists as URIs
    dataTypes = dataTypes.map(this.replaceCodelistWithUri, this);
    // Enforce the same type (class or datatype)
    // for all types in the property range.
    const result =
      this.propertyToElementCheckType(
        propertyData,
        dataTypes,
        type => type.isAssociation(),
        this.classPropertyToType
      ) ??
      this.propertyToElementCheckType(
        propertyData,
        dataTypes,
        type => type.isAttribute(),
        this.datatypePropertyToType
      );
    if (result == null) {
      throw new Error(
        `Property ${propertyData.psmIri} must use either only ` +
          "class types or only primitive types."
      );
    }
    return result;
  }

  replaceCodelistWithUri(dataType: StructureModelType): StructureModelType {
    if (
      dataType.isAssociation() &&
      dataType.dataType.isCodelist
    ) {
      return anyUriType;
    }
    return dataType;
  }

  propertyToElementCheckType(
    propertyData: StructureModelProperty,
    dataTypes: StructureModelType[],
    rangeChecker: (rangeType: StructureModelType) => boolean,
    typeConstructor: (
      propertyData: StructureModelProperty,
      dataTypes: StructureModelType[]
    ) => XmlSchemaType
  ): XmlSchemaElement | null {
    if (dataTypes.every(rangeChecker)) {
      return {
        elementName: [null, propertyData.technicalLabel],
        type: typeConstructor.call(this, propertyData, dataTypes),
        annotation: this.getAnnotation(propertyData),
      };
    }
    return null;
  }

  classPropertyToType(
    propertyData: StructureModelProperty,
    dataTypes: StructureModelComplexType[]
  ): XmlSchemaComplexType {
    const [definition, name, abstract] = this.classPropertyToComplexDefinition(
      propertyData, dataTypes
    );
    if (name != null) {
      this.types[name] = {
        name: [null, name],
        mixed: false,
        abstract: abstract,
        annotation: null,
        complexDefinition: definition
      } as XmlSchemaComplexType;
      return {
        name: [this.model.namespacePrefix, name],
        mixed: false,
        abstract: abstract,
        annotation: null,
        complexDefinition: definition
      };
    }
    return {
      name: null,
      mixed: false,
      abstract: abstract,
      annotation: null,
      complexDefinition: definition
    };
  }

  classPropertyToComplexDefinition(
    propertyData: StructureModelProperty,
    dataTypes: StructureModelComplexType[]
  ): [XmlSchemaComplexItem, string, boolean] {
    const skipIri: boolean = propertyData.dematerialize;
    if (dataTypes.length === 1) {
      const typeClass = dataTypes[0].dataType;
      const name =
        this.options.otherClasses.extractType ? typeClass.technicalLabel : null;
      const classItem = this.classToComplexType(typeClass, true, skipIri);
      return [classItem, name, false];
    }
    const classes = new Set<string>();
    const roots: StructureModelClass[] = [];
    for (const type of dataTypes) {
      const classData = type.dataType;
      classes.add(classData.psmIri);
      if (classData.extends.length == 0) {
        roots.push(classData);
      } else if (classData.extends.length > 1) {
        throw new Error(`Multiple inheritance is not supported (class ${classData.technicalLabel}).`);
      }
    }
    for (const type of dataTypes) {
      const classData = type.dataType;
      if (classData.extends.length > 0) {
        if (!classes.has(classData.extends[0].psmIri)) {
          throw new Error(`Class ${classData.technicalLabel} extends from a class outside the group.`);
        }
      }
    }

    const [rootClass, root, rootName] = this.pickChoiceRoot(roots);

    for (const type of dataTypes) {
      const classData = type.dataType;
      if (classData !== rootClass) {
        const definition = this.classToComplexType(classData, false, true);
        const baseName = classData.extends[0]?.technicalLabel ?? rootName;
        this.types[classData.technicalLabel] = {
          name: [null, classData.technicalLabel],
          mixed: false,
          abstract: false,
          annotation: null,
          complexDefinition: {
            xsType: "extension",
            base: [this.model.namespacePrefix, baseName],
            contents: [
              {
                item: definition,
                cardinalityMax: 1,
                cardinalityMin: 1
              } as XmlSchemaComplexContentItem
            ]
          } as XmlSchemaComplexExtension
        } as XmlSchemaComplexType;
      }
    }
    
    return [root, rootName, rootClass === null];
  }

  pickChoiceRoot(
    roots: StructureModelClass[]
  ): [StructureModelClass | null, XmlSchemaComplexItem, string] {
    if (roots.length == 1) {
      const classData = roots[0];
      return [
        classData,
        this.classToComplexType(classData, true),
        classData.technicalLabel
      ];
    }
    const name = "_" + roots.map(cls => cls.technicalLabel).join("_");
    return [null, {
      xsType: "sequence",
      contents: [
        iriProperty
      ]
    } as XmlSchemaComplexSequence, name];
  }

  datatypePropertyToType(
    propertyData: StructureModelProperty,
    dataTypes: StructureModelPrimitiveType[]
  ): XmlSchemaType {
    if (dataTypes.length === 1) {
      return {
        name: this.primitiveToQName(dataTypes[0]),
        annotation: null,
      };
    }
    return {
      name: null,
      annotation: null,
      simpleDefinition: {
        xsType: "union",
        contents: dataTypes.map(this.primitiveToQName, this),
      },
    } as XmlSchemaSimpleType;
  }

  primitiveToQName(primitiveData: StructureModelPrimitiveType): QName {
    if (primitiveData.dataType == null) {
      return ["xs", "anySimpleType"];
    }
    const type: QName = primitiveData.dataType.startsWith(xsdNamespace)
      ? ["xs", primitiveData.dataType.substring(xsdNamespace.length)]
      : simpleTypeMapQName[primitiveData.dataType] ?? ["xs", "anySimpleType"];
    if (type === langStringName) {
      this.usesLangString = true;
      if (type[0] == null) {
        return [this.model.namespacePrefix, type[1]];
      }
    }
    return type;
  }
}
