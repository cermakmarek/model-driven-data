import { CoreOperationResult, CoreResource, CoreTyped } from "../../core";
import { DataPsmCreate } from "./data-psm-create";
import * as PSM from "../data-psm-vocabulary";

export class DataPsmCreateClass extends DataPsmCreate {
  static readonly TYPE = PSM.CREATE_CLASS;

  dataPsmExtends: string[] = [];

  constructor() {
    super();
    this.types.push(DataPsmCreateClass.TYPE);
  }

  static is(resource: CoreResource | null): resource is DataPsmCreateClass {
    return resource?.types.includes(DataPsmCreateClass.TYPE);
  }
}

export class DataPsmCreateClassResult extends CoreOperationResult {
  static readonly TYPE = PSM.CREATE_CLASS_RESULT;

  readonly createdDataPsmClass: string;

  protected constructor(dataPsmClass: string) {
    super();
    this.types.push(DataPsmCreateClassResult.TYPE);
    this.createdDataPsmClass = dataPsmClass;
  }

  static is(resource: CoreTyped | null): resource is DataPsmCreateClassResult {
    return resource?.types.includes(DataPsmCreateClassResult.TYPE);
  }
}
