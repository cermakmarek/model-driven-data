import {fetchJsonLd, RdfFormat} from "./jsonld-adapter";

test("Load JSON-LD file.", async () => {
  const url = "https://data.mvcr.gov.cz/soubory/číselníky/"
    + "typy-pracovních-míst-na-vysoké-škole.jsonld";
  const actual = await fetchJsonLd(url, RdfFormat.JsonLd);
  console.log(actual);
});

test("Load turtle file.", async () => {
  const url = "https://data.mvcr.gov.cz/soubory/číselníky/"
    + "typy-pracovních-míst-na-vysoké-škole.ttl";
  const actual = await fetchJsonLd(url, RdfFormat.Turtle);
  console.log(actual);
});

test("Load trig file.", async () => {
  const url = "https://data.mvcr.gov.cz/soubory/číselníky/"
    + "typy-pracovních-míst-na-vysoké-škole.trig";
  const actual = await fetchJsonLd(url, RdfFormat.TriG);
  console.log(actual);
});

test("Load n-triples file.", async () => {
  const url = "https://data.mvcr.gov.cz/soubory/číselníky/"
    + "typy-pracovních-míst-na-vysoké-škole.nt";
  const actual = await fetchJsonLd(url, RdfFormat.NTriples);
  console.log(actual);
});

test("Load n-quads file.", async () => {
  const url = "https://data.mvcr.gov.cz/soubory/číselníky/"
    + "typy-pracovních-míst-na-vysoké-škole.nq";
  const actual = await fetchJsonLd(url, RdfFormat.NQuads);
  console.log(actual);
});