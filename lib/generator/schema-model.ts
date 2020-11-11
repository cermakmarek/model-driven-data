/**
 * Holds information used to generate a single item in the output context.
 */
export class PropertyData {

  id: string | undefined;

  datatype: string | undefined;

  technicalLabel: string | undefined;

  humanLabel: Record<string, string> | undefined;

  humanDescription: Record<string, string> | undefined;

  /**
   * Reference schema that describe this type.
   */
  dataTypeSchema: SchemaData[] = [];

  /**
   * As alternative to datatype, the type can be specified as a class.
   */
  dataTypeClass: ClassData[] = [];

  withInterpretation(other: PropertyData | undefined) {
    if (other === undefined) {
      return;
    }
    this.id = other.id || this.id;
    this.datatype = this.datatype || other.datatype;
    this.technicalLabel = this.technicalLabel || other.technicalLabel;
    this.humanLabel = this.humanLabel || other.humanLabel;
    this.humanDescription = this.humanDescription || other.humanDescription;
    this.dataTypeSchema =
      this.dataTypeSchema.length > 0
        ? this.dataTypeSchema : other.dataTypeSchema;
    this.dataTypeClass =
      this.dataTypeClass.length > 0
        ? this.dataTypeClass : other.dataTypeClass;
  }

}

export class ClassData {

  id: string | undefined;

  technicalLabel: string | undefined;

  humanLabel: Record<string, string> | undefined;

  humanDescription: Record<string, string> | undefined;

  extends: ClassData [] = [];

  properties: PropertyData[] = [];

  /**
   * If true instances of this class are part of a codelist.
   */
  isCodelist: boolean = false;

  withInterpretation(other: ClassData | undefined) {
    this.id = other.id || this.id;
    this.technicalLabel = this.technicalLabel || other.technicalLabel;
    this.humanLabel = this.humanLabel || other.humanLabel;
    this.humanDescription = this.humanDescription || other.humanDescription;
    this.extends =
      this.extends.length > 0 ? this.extends : other.extends;
    this.properties =
      this.properties.length > 0 ? this.properties : other.properties;
    this.isCodelist = this.isCodelist || other.isCodelist;
  }

  copy(): ClassData {
    const result = new ClassData();
    result.id = this.id;
    result.technicalLabel = this.technicalLabel;
    if (this.humanLabel !== undefined) {
      result.humanLabel = this.humanLabel;
    }
    if (this.humanDescription !== undefined) {
      result.humanDescription = this.humanDescription;
    }
    result.extends = [...this.extends];
    result.properties = [...this.properties];
    result.isCodelist = this.isCodelist;
    return result;
  }

}

export class SchemaData {

  humanLabel: Record<string, string> | undefined;

  roots: ClassData[] = [];

  prefixes: Record<string, string> = {};

  /**
   * Schemas to only reference from the output.
   */
  importSchema: SchemaData[] = [];

  /**
   * JSON-LD context location.
   */
  jsonLdContext: string | undefined;

  /**
   * Open format specification location.
   */
  fos: string | undefined;

}