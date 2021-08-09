import {createEmptyCoreResource} from "../../../core"
import {DataPsmMemoryStore} from "./data-psm-memory-store";
import * as Operations from "../../operation";

class PredictableStore extends DataPsmMemoryStore {

  protected counter = 0;

  protected createUniqueIdentifier(): string {
    return "" + ++this.counter;
  }

}

test("Create data PSM schema with class and attribute.", async () => {
  const store = new PredictableStore();

  const dataPsmSchema =
    Operations.asDataPsmCreateSchema(createEmptyCoreResource());
  dataPsmSchema.dataPsmBaseIri = "http://localhost";
  dataPsmSchema.dataPsmHumanLabel = {"en": "Test schema."};
  const dataPsmSchemaChange = await store.applyOperation(dataPsmSchema);
  expect(dataPsmSchemaChange.operation.iri).toBeDefined();
  expect(dataPsmSchemaChange.changed).toEqual([
    "http://localhost/schema/1"
  ]);
  expect(dataPsmSchemaChange.deleted).toEqual([]);

  const dataPsmClass =
    Operations.asDataPsmCreateClass(createEmptyCoreResource());
  dataPsmClass.dataPsmInterpretation = "http://localhost/cim/TheClass";
  const dataPsmClassChange = await store.applyOperation(dataPsmClass);
  expect(dataPsmClassChange.operation.iri).toBeDefined();
  expect(dataPsmClassChange.changed.sort()).toEqual([
    "http://localhost/schema/1",
    "http://localhost/class/3",
  ].sort());
  expect(dataPsmSchemaChange.deleted).toEqual([]);

  const dataPsmAttribute =
    Operations.asDataPsmCreateAttribute(createEmptyCoreResource());
  dataPsmAttribute.dataPsmDatatype = "xsd:string";
  dataPsmAttribute.dataPsmInterpretation = "http://localhost/cim/TheProperty";
  dataPsmAttribute.dataPsmOwner = "http://localhost/class/3";
  const dataPsmAttributeChange = await store.applyOperation(dataPsmAttribute);
  expect(dataPsmAttributeChange.operation.iri).toBeDefined();
  expect(dataPsmAttributeChange.changed.sort()).toEqual([
    "http://localhost/schema/1",
    "http://localhost/class/3",
    "http://localhost/attribute/5",
  ].sort());
  expect(dataPsmSchemaChange.deleted).toEqual([]);

  //

  expect((await store.listResources()).sort()).toEqual([
    "http://localhost/schema/1",
    "http://localhost/class/3",
    "http://localhost/attribute/5",
  ].sort());

  expect(await store.readResource("http://localhost/schema/1")).toEqual({
    "iri": "http://localhost/schema/1",
    "types": ["data-psm-schema"],
    "dataPsmHumanLabel": dataPsmSchema.dataPsmHumanLabel,
    "dataPsmHumanDescription": dataPsmSchema.dataPsmHumanDescription,
    "dataPsmParts": ["http://localhost/class/3", "http://localhost/attribute/5"],
    "dataPsmRoots": [],
  });

  expect(await store.readResource("http://localhost/class/3")).toEqual({
    "iri": "http://localhost/class/3",
    "types": ["data-psm-class"],
    "dataPsmInterpretation": dataPsmClass.dataPsmInterpretation,
    "dataPsmTechnicalLabel": dataPsmClass.dataPsmTechnicalLabel,
    "dataPsmHumanLabel": dataPsmClass.dataPsmHumanLabel,
    "dataPsmHumanDescription": dataPsmClass.dataPsmHumanDescription,
    "dataPsmExtends": dataPsmClass.dataPsmExtends,
    "dataPsmParts": ["http://localhost/attribute/5"],
  });

  expect(await store.readResource("http://localhost/attribute/5")).toEqual({
    "iri": "http://localhost/attribute/5",
    "types": ["data-psm-attribute"],
    "dataPsmInterpretation": dataPsmAttribute.dataPsmInterpretation,
    "dataPsmTechnicalLabel": dataPsmAttribute.dataPsmTechnicalLabel,
    "dataPsmHumanLabel": dataPsmAttribute.dataPsmHumanLabel,
    "dataPsmHumanDescription": dataPsmAttribute.dataPsmHumanDescription,
    "dataPsmDatatype": dataPsmAttribute.dataPsmDatatype,
  });

});