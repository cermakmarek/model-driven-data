import {DataPsmResource} from "@model-driven-data/core/data-psm/model";
import {useDialog} from "./useDialog";
import {LabelDescriptionEditor} from "../components/helper/LabelDescriptionEditor";
import {useCallback, useContext} from "react";
import {SetDataPsmLabelAndDescription} from "../operations/set-data-psm-label-and-description";
import {useFederatedObservableStore} from "@model-driven-data/federated-observable-store-react/store";

export const useDataPsmUpdateLabelAndDescription = (dataPsmResource: DataPsmResource) => {
  const store = useFederatedObservableStore();
  const updateLabels = useDialog(LabelDescriptionEditor, ["data", "update"], {data: {label: {}, description: {}}, update: () => {}});
  const open = useCallback(() => {
    updateLabels.open({
      data: {
        label: dataPsmResource.dataPsmHumanLabel ?? {},
        description: dataPsmResource.dataPsmHumanDescription ?? {},
      },
      update: data => {
        store.executeComplexOperation(new SetDataPsmLabelAndDescription(dataPsmResource.iri as string, data.label, data.description)).then();
      },
    });
  }, [dataPsmResource.dataPsmHumanLabel, dataPsmResource.dataPsmHumanDescription]);

  return {
    Component: updateLabels.Component,
    open,
  }
};
