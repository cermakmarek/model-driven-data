import {Box, CircularProgress, DialogContent, DialogTitle, IconButton, List, ListItem, ListItemText, TextField, Typography} from "@mui/material";
import React, {memo, useContext, useEffect, useMemo, useState} from "react";
import {BehaviorSubject} from "rxjs";
import {debounceTime} from "rxjs/operators";
import {useTranslation} from "react-i18next";
import {PimClass} from "@dataspecer/core/pim/model";
import {SlovnikGovCzGlossary} from "../slovnik.gov.cz/SlovnikGovCzGlossary";
import {ConfigurationContext} from "../App";
import InfoTwoToneIcon from '@mui/icons-material/InfoTwoTone';
import {PimClassDetailDialog} from "../detail/pim-class-detail-dialog";
import {ReadOnlyMemoryStore} from "@dataspecer/core/core";
import SearchIcon from '@mui/icons-material/Search';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import {CloseDialogButton} from "../detail/components/close-dialog-button";
import {dialog, DialogParameters, useDialog} from "../../dialog";
import {translateFrom} from "../helper/LanguageStringComponents";
import {useFederatedObservableStore} from "@dataspecer/federated-observable-store-react/store";
import {ReadOnlyMemoryStoreWithDummyPimSchema} from "@dataspecer/federated-observable-store/read-only-memory-store-with-dummy-pim-schema";

export const SearchDialog: React.FC<DialogParameters & {selected: (cls: PimClass) => void}>
    = dialog({maxWidth: "md", fullWidth: true}, memo(({close, selected}) => {

    const {cim} = React.useContext(ConfigurationContext);
    const [findResults, updateFindResults] = useState<PimClass[] | null>(null);
    const [subject, setSubject] = useState<BehaviorSubject<string> | null>(null);
    const [loading, setLoading] = useState(false);
    const [isError, setError] = useState(false);
    const {t, i18n} = useTranslation("search-dialog");

    const DetailDialog = useDialog(PimClassDetailDialog);

    // Following code creates a new store context containing downloaded data. This allow us to use standard application
    // components which render dialogs and other stuff

    const storeContext = useContext(ConfigurationContext);
    const store = useFederatedObservableStore();
    const NewStoreContext = useMemo(() => ({...storeContext, store}), [storeContext, store]);
    useEffect(() => {
        const resources = Object.fromEntries(findResults?.map(r => [r.iri, r]) ?? []);
        const readOnlyMemoryStore = ReadOnlyMemoryStore.create(resources);
        const wrappedStore = new ReadOnlyMemoryStoreWithDummyPimSchema(readOnlyMemoryStore, "http://dummy-schema/");
        store.addStore(wrappedStore);
        return () => store.removeStore(wrappedStore);
    }, [findResults, store]);
;
    useEffect(() => {
        const subject = new BehaviorSubject('');
        setSubject(subject);
        subject.subscribe(() => setError(false));
        subject.pipe(
            debounceTime(100)
        ).subscribe(term => {
            if (term) {
                setLoading(true);
                cim.cimAdapter.search(term).then(result => {
                    updateFindResults(result);
                    setLoading(false);
                }).catch(error => {
                    console.info("Error during search.", error);
                    setError(true);
                    setLoading(false);
                });
            } else {
                updateFindResults(null);
            }
        });

        // When the component unmounts, this will clean up the
        // subscription
        return () => subject.unsubscribe();
    }, [cim.cimAdapter]);

    const onChange = (e: any) => {
        if (subject) {
            return subject.next(e.target.value);
        }
    };

    return <>
        <DialogTitle>
            {t("title")}

            <CloseDialogButton onClick={close} />
        </DialogTitle>
        <DialogContent>
            <Box display={"flex"}>
                <TextField id="standard-basic" placeholder={t("placeholder")} fullWidth autoFocus onChange={onChange}
                           error={isError} variant={"standard"} autoComplete="off" />
                <CircularProgress style={{marginLeft: "1rem"}} size={30} value={0} variant={loading ? "indeterminate" : "determinate"}/>
            </Box>
            <List dense component="nav"
                sx={{
                    overflow: 'auto',
                    maxHeight: 500,
                    height: 500,
                    margin: theme => theme.spacing(2, 0, 0, 0),
                }}
            >
                {findResults && findResults.map((result: PimClass) =>
                    <ListItem button key={result.pimInterpretation} onClick={() => {
                        selected(result);
                        close();
                    }}>
                        <ListItemText secondary={<Typography variant="body2" color="textSecondary" noWrap
                                                             title={translateFrom(result.pimHumanDescription, i18n.languages)}>{translateFrom(result.pimHumanDescription, i18n.languages)}</Typography>}>
                            <strong>{translateFrom(result.pimHumanLabel, i18n.languages)}</strong>
                            {" "}
                            <SlovnikGovCzGlossary cimResourceIri={result.pimInterpretation as string}/>
                        </ListItemText>
                        <IconButton onClick={e => {
                            e.stopPropagation();
                            DetailDialog.open({iri: result.iri as string})
                        }}>
                            <InfoTwoToneIcon/>
                        </IconButton>
                    </ListItem>
                )}

                {(!findResults || findResults.length === 0) &&
                <Box sx={{
                    height: 300,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: (theme) => theme.palette.grey[500],
                    flexDirection: "column",
                }}>
                    {!findResults && <><SearchIcon sx={{display: "block", height: "4rem", width: "4rem"}} />{t('info panel start typing')}</>}
                    {findResults && <><SearchOffIcon sx={{display: "block", height: "4rem", width: "4rem"}} />{t('info panel nothing found')}</>}
                </Box>}
            </List>
        </DialogContent>

        <ConfigurationContext.Provider value={NewStoreContext}>
            <DetailDialog.Component />
        </ConfigurationContext.Provider>
    </>;
}));