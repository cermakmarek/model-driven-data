import {
    CsvSchema,
    SingleTableSchema,
    MultipleTableSchema,
    Table,
    TableSchema,
    Column,
    ForeignKey,
    Reference
} from "./csv-schema-model";
import {
    StructureModel,
    StructureModelPrimitiveType,
    StructureModelProperty,
    StructureModelClass
} from "../structure-model";
import { DataSpecification } from "../data-specification/model";
import {
    assert,
    assertFailed,
    LanguageString
} from "../core";
import { OFN } from "../well-known";

const idPrefix = "https://ofn.gov.cz/schema";

/**
 * This function creates CSV schema from StructureModel and DataSpecification.
 */
export function structureModelToCsvSchema(
    specification: DataSpecification,
    model: StructureModel
) : CsvSchema {
    assert(model.roots.length === 1, "Exactly one root class must be provided.");

    const single = Math.random() < 0.5; // Todo: replace by a configuration

    if (single) return createSingleTableSchema(specification, model);
    else return createMultipleTableSchema(specification, model);
}

/**
 * This function creates a schema that consists of multiple tables.
 * @param specification
 * @param model
 */
function createMultipleTableSchema(
    specification: DataSpecification,
    model: StructureModel
) : MultipleTableSchema {
    const schema = new MultipleTableSchema();
    makeTablesRecursive(model.classes, schema.tables, model.roots[0], idPrefix + specification.artefacts[4].publicUrl + "/tables/", { value: 1 }, null);
    return schema;
}

/**
 * Every call of this function adds a table to tables.
 * @param classes Object with classes to process
 * @param tables Array to store created tables
 * @param currentClass The parameter of recursion
 * @param namePrefix Prefix for table identifier
 * @param nameNumber Number of the table in its identifier, it is in an object because it must be passed by reference
 * @param reference Reference for the foreign key
 */
function makeTablesRecursive (
    classes: { [i: string]: StructureModelClass },
    tables: Table[],
    currentClass: string,
    namePrefix: string,
    nameNumber: { value: number },
    reference: Reference | null
) : void {
    const table = new Table();
    tables.push(table);
    table.url = namePrefix + nameNumber.value++ + ".csv";
    table.tableSchema = new TableSchema();

    const idColName = "ReferenceId";

    if (reference !== null) {
        const fkey = new ForeignKey();
        fkey.columnReference = idColName;
        fkey.reference = reference;
        table.tableSchema.foreignKeys.push(fkey);
    }

    // adds a column for identifier
    const idCol = new Column();
    idCol.name = idColName;
    idCol.datatype = "string";
    table.tableSchema.columns.push(idCol);

    for (const property of classes[currentClass].properties) {
        const dataType = property.dataTypes[0];
        if (dataType.isAssociation()) {
            const associatedClass = dataType.psmClassIri;
            table.tableSchema.columns.push(makeSimpleColumn(property, "", "string", classes[associatedClass].isCodelist));
            if (classes[associatedClass].properties.length !== 0) {
                const reference = new Reference();
                reference.resource = table.url;
                reference.columnReference = encodeURI(property.technicalLabel);
                makeTablesRecursive(classes, tables, associatedClass, namePrefix, nameNumber, reference);
            }
        }
        else if (dataType.isAttribute()) table.tableSchema.columns.push(makeSimpleColumn(property, "", structureModelPrimitiveToCsvDefinition(dataType), false));
        else assertFailed("Unexpected datatype!");
    }

    // adds rdf:type virtual column
    const virtualCol = new Column();
    virtualCol.virtual = true;
    virtualCol.propertyUrl = "rdf:type";
    virtualCol.valueUrl = classes[currentClass].cimIri;
    table.tableSchema.columns.push(virtualCol);
}

/**
 * This function creates a schema that consists of a single table.
 * @param specification
 * @param model
 */
function createSingleTableSchema(
    specification: DataSpecification,
    model: StructureModel
) : SingleTableSchema {
    const schema = new SingleTableSchema();
    schema.table["@id"] = idPrefix + specification.artefacts[4].publicUrl;
    schema.table.url = idPrefix + specification.artefacts[4].publicUrl + "/table.csv";
    schema.table.tableSchema = new TableSchema();
    fillTableSchemaRecursive(model.classes, schema.table.tableSchema, model.roots[0], "");

    // adds rdf:type virtual column
    const virtualCol = new Column();
    virtualCol.virtual = true;
    virtualCol.propertyUrl = "rdf:type";
    virtualCol.valueUrl = model.classes[model.roots[0]].cimIri;
    schema.table.tableSchema.columns.push(virtualCol);

    return schema;
}

/**
 * This function recursively adds columns to the table schema. It calls itself if it finds an association with some properties.
 * @param classes Object with classes to process
 * @param tableSchema The table schema to be filled
 * @param currentClass The parameter of recursion
 * @param prefix Prefix of created columns
 */
function fillTableSchemaRecursive (
    classes: { [i: string]: StructureModelClass },
    tableSchema: TableSchema,
    currentClass: string,
    prefix: string
) : void {
    for (const property of classes[currentClass].properties) {
        const dataType = property.dataTypes[0];
        if (dataType.isAssociation()) {
            const associatedClass = dataType.psmClassIri;
            if (classes[associatedClass].properties.length === 0) tableSchema.columns.push(makeSimpleColumn(property, prefix, "string", classes[associatedClass].isCodelist));
            else fillTableSchemaRecursive(classes, tableSchema, associatedClass, prefix + property.technicalLabel + "_");
        }
        else if (dataType.isAttribute()) tableSchema.columns.push(makeSimpleColumn(property, prefix, structureModelPrimitiveToCsvDefinition(dataType), false));
        else assertFailed("Unexpected datatype!");
    }
}

/**
 * This function creates a simple column and fills its data from the property.
 * @param property Most of the column's data are taken from this property.
 * @param namePrefix Name of the column has this prefix.
 * @param datatype The column has this datatype.
 * @param isCodelist Does the column contain a code list?
 * @returns The new and prepared column
 */
function makeSimpleColumn(
    property: StructureModelProperty,
    namePrefix: string,
    datatype: string | null,
    isCodelist: boolean
) : Column {
    const column = new Column();
    column.name = encodeURI(namePrefix + property.technicalLabel);
    column.titles = namePrefix + property.technicalLabel;
    column["dc:title"] = transformLanguageString(property.humanLabel);
    if (isCodelist) column.valueUrl = "{+" + column.name + "}";
    else column.datatype = datatype;
    column["dc:description"] = transformLanguageString(property.humanDescription);
    column.propertyUrl = property.cimIri;
    column.lang = "cs";
    column.required = property.cardinalityMin === 1 && property.cardinalityMax === 1;
    return column;
}

/**
 * This function transforms our common language string to CSVW format.
 * @param langString Language string for transformation
 * @returns Different representation of the language string used in CSVW
 */
function transformLanguageString (
    langString: LanguageString
) : { [i: string]: string } | { [i: string]: string }[] | null {
    if (!langString) return null;
    const languages = Object.keys(langString);
    if (languages.length === 0) return null;
    if (languages.length === 1) return { "@value": langString[languages[0]], "@language": languages[0] };
    const result = [];
    for (const language in langString) result.push({ "@value": langString[language], "@language": language });
    return result;
}

/**
 * This function translates primitive types from structure model to CSVW types according to https://www.w3.org/TR/tabular-metadata/#datatypes.
 * @param primitive Primitive type from structure model
 * @returns String name of the translated datatype or null if not applicable
 */
function structureModelPrimitiveToCsvDefinition(
    primitive: StructureModelPrimitiveType
) : string | null {
    let result = null;
    switch (primitive.dataType) {
        case OFN.boolean:
            result = "boolean";
            break;
        case OFN.date:
            result = "date";
            break;
        case OFN.time:
            result = "time";
            break;
        case OFN.dateTime:
            result = "dateTime";
            break;
        case OFN.integer:
            result = "integer";
            break;
        case OFN.decimal:
            result = "decimal";
            break;
        case OFN.url:
            result = "anyURI";
            break;
        case OFN.string:
            result = "string";
            break;
        case OFN.text:
            result = "string";
            break;
    }
    return result;
}
