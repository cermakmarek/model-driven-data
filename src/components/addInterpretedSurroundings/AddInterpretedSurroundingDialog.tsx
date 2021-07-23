import {
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    ListItem,
    ListItemIcon,
    ListItemText,
    Typography
} from "@material-ui/core";
import React, {useCallback, useEffect, useState} from "react";
import {
    IdProvider,
    PimAssociation,
    PimAttribute,
    PimClass,
    PsmClass,
    Slovnik,
    SlovnikPimMetadata,
    Store
} from 'model-driven-data';
import {GlossaryNote} from "../slovnik.gov.cz/GlossaryNote";
import {LoadingDialog} from "../helper/LoadingDialog";
import {createStyles, makeStyles, Theme} from "@material-ui/core/styles";
import {AncestorSelectorPanel} from "./AncestorSelectorPanel";
import {useTranslation} from "react-i18next";
import InfoTwoToneIcon from '@material-ui/icons/InfoTwoTone';
import {useDialog} from "../../hooks/useDialog";
import {PimAttributeDetailDialog} from "../pimDetail/pimAttributeDetailDialog";
import {PimClassDetailDialog} from "../pimDetail/pimClassDetailDialog";
import {PimAssociationDetailDialog} from "../pimDetail/pimAssociationDetailDialog";

type EntityType = PimAssociation | PimAttribute;

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        ancestorPane: {
            borderRight: "1px solid " + theme.palette.divider
        },
    }),
);

interface AddInterpretedSurroundingDialogProperties {
    store: Store,
    isOpen: boolean,
    close: () => void,
    selected: (forClass: PsmClass, store: Store, attributes: PimAttribute[], associations: PimAssociation[]) => void,
    psmClass: PsmClass | null
}

export const AddInterpretedSurroundingDialog: React.FC<AddInterpretedSurroundingDialogProperties> = ({store, isOpen, close, selected, psmClass}) => {
    const styles = useStyles();
    const {t} = useTranslation("interpretedSurrounding");

    // @ts-ignore
    const cimId: string = psmClass ? (store[psmClass?.psmInterpretation] as PimClass).pimInterpretation : "";

    // For which CIM iris the loading is in progress
    const [currentCIM, setCurrentCIM] = useState<string>("");
    const [surroundings, setSurroundings] = useState<Record<string, Store | undefined>>({});

    const switchToCim = useCallback ((cim: string) => {
        setCurrentCIM(cim);
        if (!surroundings.hasOwnProperty(cim)) {
            setSurroundings({...surroundings, [cim]: undefined});

            const slovnik = new Slovnik(new IdProvider());
            slovnik.getSurroundings(cim).then(result => {
                setSurroundings({...surroundings, [cim]: result});
            });
        }
    }, [surroundings]);

    const [selectedEntities, setSelectedEntities] = useState<EntityType[]>([]);
    const toggleSelectedEntities = (entity: EntityType) => () => {
        if (selectedEntities.includes(entity)) {
            setSelectedEntities(selectedEntities.filter(a => a !== entity));
        } else {
            setSelectedEntities([...selectedEntities, entity])
        }
    };

    useEffect(() => {
        if (isOpen) {
            switchToCim(cimId);
        } else {
            setSelectedEntities([]);
            setSurroundings({});
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, cimId]); // change of switchToCim should not trigger this effect

    const attributeDetail = useDialog(PimAttributeDetailDialog, "attribute");
    const classDialog = useDialog(PimClassDetailDialog, "cls");
    const associationDialog = useDialog(PimAssociationDetailDialog, "association");

    if (!psmClass) return null;

    const currentSurroundings = surroundings[currentCIM];

    const attributes = currentSurroundings ? Object.values(currentSurroundings).filter(PimAttribute.is) : [];
    const associations = currentSurroundings ? Object.values(currentSurroundings).filter(PimAssociation.is) : [];
    const forwardAssociations = currentSurroundings ? associations.filter(a => a.pimEnd[0].pimParticipant && (currentSurroundings[a.pimEnd[0].pimParticipant] as PimClass)?.pimInterpretation === currentCIM) : [];
    const backwardAssociations = currentSurroundings ? associations.filter(a => a.pimEnd[1].pimParticipant && (currentSurroundings[a.pimEnd[1].pimParticipant] as PimClass)?.pimInterpretation === currentCIM) : [];

    return <Dialog onClose={close} open={isOpen} fullWidth maxWidth={"md"}>
        <DialogTitle id="customized-dialog-title">
            {t("title")}
        </DialogTitle>

        <DialogContent dividers>
            <Grid container spacing={3}>
                <Grid item xs={3} className={styles.ancestorPane}>
                    <AncestorSelectorPanel forCimId={cimId} selectedAncestorCimId={currentCIM} selectAncestorCim={switchToCim} />
                </Grid>
                <Grid item xs={9}>
                    {surroundings[currentCIM] === undefined && <LoadingDialog />}

                    {surroundings[currentCIM] === undefined ||
                        <>
                            <Typography variant={"h6"}>{t("attributes")}</Typography>
                            {attributes && attributes.map((entity: PimAttribute) =>
                                <ListItem key={entity.id} role={undefined} dense button onClick={toggleSelectedEntities(entity)}>
                                    <ListItemIcon>
                                        <Checkbox
                                            edge="start"
                                            checked={selectedEntities.includes(entity)}
                                            tabIndex={-1}
                                            disableRipple
                                        />
                                    </ListItemIcon>
                                    <ListItemText secondary={<Typography variant="body2" color="textSecondary" noWrap title={entity.pimHumanDescription?.cs}>{entity.pimHumanDescription?.cs}</Typography>}>
                                        <strong>{entity.pimHumanLabel?.cs}</strong>
                                        {" "}
                                        <GlossaryNote entity={entity as SlovnikPimMetadata} />
                                        {" "}
                                        <IconButton size="small" onClick={(event) => {attributeDetail.open({attribute: entity}); event.stopPropagation();}}><InfoTwoToneIcon fontSize="inherit" /></IconButton>
                                    </ListItemText>
                                </ListItem>
                            )}
                            {attributes && attributes.length === 0 &&
                            <Typography color={"textSecondary"}>{t("no attributes")}</Typography>
                            }

                            <Typography variant={"h6"}>{t("associations")}</Typography>
                            {forwardAssociations && forwardAssociations.map((entity: PimAssociation) =>
                                <ListItem key={entity.id} role={undefined} dense button onClick={toggleSelectedEntities(entity)}>
                                    <ListItemIcon>
                                        <Checkbox
                                            edge="start"
                                            checked={selectedEntities.includes(entity)}
                                            tabIndex={-1}
                                            disableRipple
                                        />
                                    </ListItemIcon>
                                    <ListItemText secondary={<Typography variant="body2" color="textSecondary" noWrap title={entity.pimHumanDescription?.cs}>{entity.pimHumanDescription?.cs}</Typography>}>
                                        <strong>{entity.pimHumanLabel?.cs}</strong>
                                        {" "}
                                        <GlossaryNote entity={entity as SlovnikPimMetadata}/>
                                        {" "}
                                        <IconButton size="small" onClick={(event) => {associationDialog.open({association: entity}); event.stopPropagation();}}><InfoTwoToneIcon fontSize="inherit" /></IconButton>
                                        {" "}
                                        {entity.pimEnd[1].pimParticipant && currentSurroundings &&
                                        <span>({(currentSurroundings[entity.pimEnd[1].pimParticipant] as PimClass).pimHumanLabel?.cs}
                                            ){" "}
                                            <IconButton size="small" onClick={(event) => {entity.pimEnd[1].pimParticipant && classDialog.open({cls: currentSurroundings[entity.pimEnd[1].pimParticipant] as PimClass}); event.stopPropagation();}}><InfoTwoToneIcon fontSize="inherit" /></IconButton>
                                            </span>
                                        }
                                    </ListItemText>
                                </ListItem>
                            )}

                            {forwardAssociations.length === 0 &&
                            <Typography color={"textSecondary"}>{t("no associations")}</Typography>
                            }

                            <Typography variant={"h6"}>{t("backward associations")}</Typography>
                            {backwardAssociations && backwardAssociations.map((entity: PimAssociation) =>
                                <ListItem key={entity.id} role={undefined} dense button onClick={toggleSelectedEntities(entity)}>
                                    <ListItemIcon>
                                        <Checkbox
                                            edge="start"
                                            checked={selectedEntities.includes(entity)}
                                            tabIndex={-1}
                                            disableRipple
                                        />
                                    </ListItemIcon>
                                    <ListItemText secondary={<Typography variant="body2" color="textSecondary" noWrap title={entity.pimHumanDescription?.cs}>{entity.pimHumanDescription?.cs}</Typography>}>
                                        {entity.pimEnd[0].pimParticipant && <span>({currentSurroundings && (currentSurroundings[entity.pimEnd[0].pimParticipant] as PimClass).pimHumanLabel?.cs}
                                            ){" "}
                                            <IconButton size="small" onClick={(event) => {currentSurroundings && entity.pimEnd[0].pimParticipant && classDialog.open({cls: currentSurroundings[entity.pimEnd[0].pimParticipant] as PimClass}); event.stopPropagation();}}><InfoTwoToneIcon fontSize="inherit" /></IconButton>
                                            </span>}
                                        {" "}
                                        <strong>{entity.pimHumanLabel?.cs}</strong>
                                        {" "}
                                        <GlossaryNote entity={entity as SlovnikPimMetadata}/>
                                        {" "}
                                        <IconButton size="small" onClick={(event) => {associationDialog.open({association: entity}); event.stopPropagation();}}><InfoTwoToneIcon fontSize="inherit" /></IconButton>
                                    </ListItemText>
                                </ListItem>
                            )}

                            {backwardAssociations.length === 0 &&
                            <Typography color={"textSecondary"}>{t("no backward associations")}</Typography>
                            }
                        </>
                    }
                </Grid>
            </Grid>
        </DialogContent>
        <DialogActions>
            <Button onClick={close} color="primary">{t("close button")}</Button>
            <Button
                onClick={() => {close(); currentSurroundings && selected(psmClass, Object.fromEntries((Object.values(surroundings).filter(v => v !== undefined) as Store[]).map(Object.entries).flat()), selectedEntities.filter(PimAttribute.is), selectedEntities.filter(PimAssociation.is))}}
                disabled={selectedEntities.length === 0}
                color="secondary">
                {t("confirm button")}
            </Button>
        </DialogActions>

        <attributeDetail.component store={store} />
        <classDialog.component store={store} />
        <associationDialog.component store={store} />
    </Dialog>;
};
