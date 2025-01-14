import {LanguageString} from "@dataspecer/core/core";

export interface KnownDatatype {
    label?: LanguageString;
    prefix?: string;
    localPart?: string;
    documentation?: string;
    iri: string;
}

export const knownDatatypes: KnownDatatype[] = [
    {
        "iri": "https://ofn.gov.cz/zdroj/základní-datové-typy/2020-07-01/boolean",
        "documentation": "https://ofn.gov.cz/základní-datové-typy/2020-07-01/#boolean",
        "label": {
            "cs": "Booleovská hodnota - Ano či ne",
            "en": "Boolean"
        }
    },
    {
        "iri": "https://ofn.gov.cz/zdroj/základní-datové-typy/2020-07-01/datum",
        "documentation": "https://ofn.gov.cz/základní-datové-typy/2020-07-01/#datum",
        "label": {
            "cs": "Datum",
            "en": "Date"
        }
    },
    {
        "iri": "https://ofn.gov.cz/zdroj/základní-datové-typy/2020-07-01/čas",
        "documentation": "https://ofn.gov.cz/základní-datové-typy/2020-07-01/#čas",
        "label": {
            "cs": "Čas",
            "en": "Time"
        }
    },
    {
        "iri": "https://ofn.gov.cz/zdroj/základní-datové-typy/2020-07-01/datum-a-čas",
        "documentation": "https://ofn.gov.cz/základní-datové-typy/2020-07-01/#datum-a-čas",
        "label": {
            "cs": "Datum a čas",
            "en": "Date and time"
        }
    },
    {
        "iri": "https://ofn.gov.cz/zdroj/základní-datové-typy/2020-07-01/celé-číslo",
        "documentation": "https://ofn.gov.cz/základní-datové-typy/2020-07-01/#celé-číslo",
        "label": {
            "cs": "Celé číslo",
            "en": "Integer"
        }
    },
    {
        "iri": "https://ofn.gov.cz/zdroj/základní-datové-typy/2020-07-01/desetinné-číslo",
        "documentation": "https://ofn.gov.cz/základní-datové-typy/2020-07-01/#desetinné-číslo",
        "label": {
            "cs": "Desetinné číslo",
            "en": "Decimal number"
        }
    },
    {
        "iri": "https://ofn.gov.cz/zdroj/základní-datové-typy/2020-07-01/url",
        "documentation": "https://ofn.gov.cz/základní-datové-typy/2020-07-01/#url",
        "label": {
            "cs": "URI, IRI, URL",
            "en": "URI, IRI, URL"
        }
    },
    {
        "iri": "https://ofn.gov.cz/zdroj/základní-datové-typy/2020-07-01/řetězec",
        "documentation": "https://ofn.gov.cz/základní-datové-typy/2020-07-01/#řetězec",
        "label": {
            "cs": "Řetězec",
            "en": "String"
        }
    },
    {
        "iri": "https://ofn.gov.cz/zdroj/základní-datové-typy/2020-07-01/text",
        "documentation": "https://ofn.gov.cz/základní-datové-typy/2020-07-01/#text",
        "label": {
            "cs": "Text",
            "en": "Text"
        }
    }
];
