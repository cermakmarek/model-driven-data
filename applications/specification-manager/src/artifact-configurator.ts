import {DefaultArtifactConfigurator} from "@model-driven-data/core/data-specification/default-artifact-configurator";
import {DataSpecificationArtefact, DataSpecificationDocumentation, DataSpecificationSchema} from "@model-driven-data/core/data-specification/model";
import {PlantUmlGenerator} from "@model-driven-data/core/plant-uml";
import {PlantUmlImageGenerator} from "./artifacts/plant-uml-image-generator";
import {BIKESHED} from "@model-driven-data/core/bikeshed";
import {BikeshedHtmlGenerator} from "./artifacts/bikeshed-html-generator";

export class ArtifactConfigurator extends DefaultArtifactConfigurator {
  public async generateFor(
    dataSpecificationIri: string,
  ): Promise<DataSpecificationArtefact[]> {
    const artifacts = await super.generateFor(dataSpecificationIri);
    const currentSchemaArtefacts = artifacts
        .filter(artifact => DataSpecificationSchema.is(artifact))
        .map(artifact => artifact.iri as string);

    const dataSpecification = this.dataSpecifications.find(
        dataSpecification => dataSpecification.iri === dataSpecificationIri,
    );

    if (dataSpecification === undefined) {
      throw new Error(`Data specification with IRI ${dataSpecificationIri} not found.`);
    }

    const dataSpecificationName = await this.getSpecificationDirectoryName(dataSpecificationIri);

    // PlantUML source
    const plantUml = new DataSpecificationDocumentation();
    plantUml.outputPath = `${dataSpecificationName}/conceptual-model.plantuml`;
    plantUml.publicUrl = plantUml.outputPath;
    plantUml.generator = PlantUmlGenerator.IDENTIFIER;
    artifacts.push(plantUml);

    // PlantUml image
    const plantUmlImage = new DataSpecificationDocumentation();
    plantUmlImage.outputPath = `${dataSpecificationName}/conceptual-model.png`;
    plantUmlImage.publicUrl = plantUmlImage.outputPath;
    plantUmlImage.generator = PlantUmlImageGenerator.IDENTIFIER;
    artifacts.push(plantUmlImage);


    // Bikeshed source
    const bikeshed = new DataSpecificationDocumentation();
    bikeshed.outputPath = `${dataSpecificationName}/documentation.bs`;
    bikeshed.publicUrl = bikeshed.outputPath;
    bikeshed.generator = BIKESHED.Generator;
    bikeshed.artefacts = currentSchemaArtefacts;
    artifacts.push(bikeshed);

    // Bikeshed HTML
    const bikeshedHtml = new DataSpecificationDocumentation();
    bikeshedHtml.outputPath = `${dataSpecificationName}/documentation.html`;
    bikeshedHtml.publicUrl = bikeshedHtml.outputPath;
    bikeshedHtml.generator = BikeshedHtmlGenerator.IDENTIFIER;
    bikeshedHtml.artefacts = currentSchemaArtefacts;
    artifacts.push(bikeshedHtml);

    return artifacts;
  }
}
