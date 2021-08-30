import {
  CoreResourceReader, createErrorOperationResult,
  CreateNewIdentifier, createSuccessOperationResult, ExecutorResult,
} from "../../core";
import {DataPsmDeleteClass} from "../operation";
import {loadDataPsmClass, loadDataPsmSchema} from "./data-psm-executor-utils";


export async function executesDataPsmDeleteClass(
  createNewIdentifier: CreateNewIdentifier,
  modelReader: CoreResourceReader,
  operation: DataPsmDeleteClass,
): Promise<ExecutorResult> {
  const schema = await loadDataPsmSchema(modelReader);
  if (schema === null) {
    return createErrorOperationResult(
      "Missing schema object.");
  }

  const classToDelete =
    await loadDataPsmClass(modelReader, operation.dataPsmClass);
  if (classToDelete === null) {
    return createErrorOperationResult(
      "Missing class to delete.");
  }

  if (classToDelete.dataPsmParts.length > 0) {
    return createErrorOperationResult(
      "Only empty class can be deleted.");
  }

  // TODO Check that no other class extends this class.

  schema.dataPsmRoots =
    schema.dataPsmRoots.filter(iri => iri !== operation.dataPsmClass);
  schema.dataPsmParts =
    schema.dataPsmParts.filter(iri => iri !== operation.dataPsmClass);

  return createSuccessOperationResult(
    [], [schema], [operation.dataPsmClass]);
}
