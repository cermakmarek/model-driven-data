# Comments and Ideas
This page should house the ideas and comments considered, yet sometimes not implemented, in the code base.
The benefit of having his page is to capture the reasons behind not doing something.
The notes here should be similar to issues, where a modification is prosed.
In addition, an argument why it was not implemented must be provided.

## Null vs Undefined
*2021.09.09*:
We employ ```null``` to indicate missing value. 
As a result, if a function can optionally return string the return type is ```string | null``` not ```string | undefined```.
For a class/interface properties with ```null``` indicates possible missing value.
For example ```technicalLabel: string | null``` indicates situation where the ```technicalLabel``` may be set to particular value or left empty.

An exception to this rule is when a particular code deals with a third party code that require use of ```undefiend```.  

## Adapter naming
*2021.08.26*:
Adapter is a class, or a method that convert data from input type to output type. 
The name of the adapter method, or class member method must adhere to following pattern ```{from}To{To}```. 
For example adapter from RDF to ObjectModel should be named ```rdfToObjectModel```.

## Third-party libraries
*2021.08.26*:
In order to use a library in this project, the library needs to maintained and adopted by several projects. 
This can often be indicated by number of starts and how quickly are issues resolved. 
Before a new library is added there should be an internal discussion. 
As libraries adds external dependencies it is always worth to consider implementing the same functionality within the repository; should that implementation be straightforward.

## Granular core interfaces/classes for model
*2021.08.09*:
As of now we have tree-like structure for base classes in data-psm, but similar is in pim model.
Instead, we may define three separate types (human-readable, interpretable and technical) and provide way to detect those types.
In order to make this work we would need to change the interfaces to classes, to implement the type detection.

The disadvantage is that by assigning methods to the model objects we can not use ```as``` methods to simply cast the resources.
This can be an issue as a single resource may have multiple types when loaded from RDF.
Should we decide that each resource, IRI, can be of only one type, we may decide to convert the code to classes.

*2021.09.13*:
As a result of using ```null``` instead of ```undefined``` (see _Null vs Undefined_ *2021.09.09*) we need to set properties to null when an instance of a class is created.
In order archive that we need the ```as``` methods to set all properties, by doing, so they become almost a factory methods.

Once we start to use the business logic not only for loaders and generators it becomes clear, that handling object with multiple distinct types is impractical/too complicated.
Therefore, we force each resource, object with identifier, to have only one type.
This can easily be archived in the code, the only issue may come when loading RDF data. 
But even with RDF it may still not be clear what is the meaning of such object and handling of interactions, for example delete of association which is also a class.

This lead us to reverting our previous decision and forcing each object to have only one final type.
Still we support inheritance meaning that object can have multiple types if they are linear specializations.

As a part of this decision we migrate the interfaces back to classes, moving the ```as``` and ```is``` methods to the class as static methods.
A model class MUST NOT have any non-static methods.

## Operations and inconsistent state
*2021.07.28*:
Especially on platform specific level (PSM) level some operations may lead to state which is inconsistent with platform independent level (PIM).  
Those operations are mainly changes in the interpretation.
For example, we may have PSM class with PSM attribute, both with interpretation to PIM.
Now we decide to change the PSM attribute interpretation to PIM attribute that is not part of the PSM class's interpretation.
This lead to an invalid state.
We can tackle this by validating the operation in each operation, thus each operation would lead to a consistent state.
This may, however, prevent some use-cases where for example both interpretation of the PSM class and PSM attribute need to be changed.
As a solution we decide to not validate the state in the operation, so an invalid state can be produced.
In addition, we introduce validators that would validate the state.
It is then upon the application to either use the validators to reject operations leading to an invalid state, or allow them and just notify user about the inconsistencies.

Keep in mind that the operation still validate the state on their level.
For example when an attribute is created it must be owned by a class or a property container.

## Input/Output as a parameter
*2021.07.28*:
All input/output operations must be defined in the ```io``` package as interfaces.
This does apply, but is not limited, to fetch operation and text input/output operations.
The code must use only the ```io``` interfaces of such operations not their particular implementations.
In addition, any method using one of the interfaces must take the interface as an argument.

This allows user core to decide which implementation should be used.
As a result we should be able to support input/output for browser, NodeJs and test environment.