import React, {memo, useCallback} from "react";
import {useToggle} from "../../hooks/useToggle";
import {DataPsmClassPartItemProperties, useItemStyles} from "./PsmItemCommon";
import {useTranslation} from "react-i18next";
import {DataPsmDeleteButton} from "./class/DataPsmDeleteButton";
import RemoveIcon from '@mui/icons-material/Remove';
import {DataPsmGetLabelAndDescription} from "./common/DataPsmGetLabelAndDescription";
import {DataPsmAttribute, DataPsmClass} from "@dataspecer/core/data-psm/model";
import classNames from "classnames";
import {DataPsmAttributeDetailDialog} from "../detail/data-psm-attribute-detail-dialog";
import {InlineEdit} from "./common/InlineEdit";
import {useResource} from "@dataspecer/federated-observable-store-react/use-resource";
import {DeleteAttribute} from "../../operations/delete-attribute";
import {Datatype} from "./common/Datatype";
import {ItemRow} from "./item-row";
import {MenuItem} from "@mui/material";
import {Icons} from "../../icons";
import {getCardinalityFromResource} from "./common/cardinality";
import {PimAttribute} from "@dataspecer/core/pim/model";
import {useFederatedObservableStore} from "@dataspecer/federated-observable-store-react/store";

export const DataPsmAttributeItem: React.FC<DataPsmClassPartItemProperties> = memo(({dataPsmResourceIri: dataPsmAttributeIri, dragHandleProps, parentDataPsmClassIri}) => {
    const {resource: dataPsmAttribute, isLoading} = useResource<DataPsmAttribute>(dataPsmAttributeIri);
    const {resource: pimAttribute} = useResource<PimAttribute>(dataPsmAttribute?.dataPsmInterpretation ?? null);
    const readOnly = false;

    const dialog = useToggle();
    const {t} = useTranslation("psm");
    const styles = useItemStyles();

    const store = useFederatedObservableStore();
    const {resource: ownerClass} = useResource<DataPsmClass>(parentDataPsmClassIri);
    const del = useCallback(() => dataPsmAttribute && ownerClass && store.executeComplexOperation(new DeleteAttribute(dataPsmAttribute, ownerClass)), [dataPsmAttribute, ownerClass, store]);

    const inlineEdit = useToggle();

    return <>
        <li className={classNames(styles.li, {[styles.loading]: isLoading})}>
            <ItemRow actions={inlineEdit.isOpen || <>
                {readOnly ?
                    <MenuItem onClick={dialog.open} title={t("button edit")}><Icons.Tree.Info/></MenuItem> :
                    <MenuItem onClick={dialog.open} title={t("button info")}><Icons.Tree.Edit/></MenuItem>
                }
                {readOnly ||
                    (parentDataPsmClassIri && <DataPsmDeleteButton onClick={del} />)
                }
            </>} readOnly={readOnly}>
                {dataPsmAttribute &&
                    <>
                        <RemoveIcon style={{verticalAlign: "middle"}} />
                        {' '}
                        <span {...dragHandleProps} onDoubleClick={readOnly ? () => null : inlineEdit.open}>
                            <DataPsmGetLabelAndDescription dataPsmResourceIri={dataPsmAttributeIri}>
                                {(label, description) =>
                                    <span title={description} className={styles.attribute}>{label}</span>
                                }
                            </DataPsmGetLabelAndDescription>

                            {inlineEdit.isOpen ? <>
                                <InlineEdit close={inlineEdit.close}  dataPsmResource={dataPsmAttribute} resourceType={"attribute"}/>
                            </> : <>
                                {!!(dataPsmAttribute?.dataPsmTechnicalLabel && dataPsmAttribute.dataPsmTechnicalLabel.length) &&
                                    <> (<span className={styles.technicalLabel}>{dataPsmAttribute.dataPsmTechnicalLabel}</span>)</>
                                }

                                {dataPsmAttribute?.dataPsmDatatype && dataPsmAttribute.dataPsmDatatype.length && <>
                                    {' : '}
                                    <Datatype iri={dataPsmAttribute.dataPsmDatatype} className={styles.type} />
                                </>}

                                {pimAttribute && (" " + getCardinalityFromResource(pimAttribute))}
                            </>}
                        </span>
                    </>
                }

            </ItemRow>
        </li>

        <DataPsmAttributeDetailDialog iri={dataPsmAttributeIri} isOpen={dialog.isOpen} close={dialog.close} />
    </>;
});
