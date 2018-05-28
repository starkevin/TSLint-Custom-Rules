import * as ts from "typescript";
import * as Lint from "tslint";
import { isTypeReference, isClassDeclaration } from "tsutils";

/**
 * Required for this rule.
 */
declare global {
    function override(...args: any[]): void;
}

/**
 * Decorator that doesn't do anything.
 */
(global as any).override = function override(...args: any[]) {
    /// Purposely does nothing.
    args;
}

/**
 * Rule to force override decorator
 */
export class Rule extends Lint.Rules.TypedRule {

    /**
     * Meta data around the rule
     */
    public static metadata: Lint.IRuleMetadata = {
        ruleName: "declare-override",
        description: "Overrides in TypeScript must be declared by the presence of an Override decorator",
        descriptionDetails: "",
        rationale: Lint.Utils.dedent`
            This rule forces the usage of a decoarator declared as @override to be used whenever an method or property is overriden`,
        optionsDescription: "Not configurable.",
        options: null,
        optionExamples: [],
        type: "maintainability",
        typescriptOnly: true,
    };

    /**
     * Failure string
     */
    public static FAILURE_MISSING_OVERRIDE_STRING = "Missing override decorator";

    /**
     * Failure string
     */
    public static FAILURE_UNNESSESARY_OVERRIDE_STRING = "Unnessesary override decorator";

    /**
     * Implements the walker
     * @param sourceFile 
     */
    @override public applyWithProgram(sourceFile: ts.SourceFile, program: ts.Program): Lint.RuleFailure[] {
        return this.applyWithWalker(new OverrideWalker(program.getSourceFile(sourceFile.fileName), this.ruleName, program.getTypeChecker()));
    }
}

/**
 * Advanced walker for override linting rule
 * Must implement @override decorator.
 */
class OverrideWalker extends Lint.AbstractWalker<ts.TypeChecker> {
    
    
    /**
     * List of clauses for this item
     */
    private heritageClauses: string[];
    
    
    /**
     * 
     * @param sourceFile 
     */
    @override public walk(sourceFile: ts.SourceFile) {
        ts.forEachChild(sourceFile, this.visitNode.bind(this));
    }
    
    /**
     * 
     * @param node 
     */
    private visitNode(node: ts.Node) {
        /// Store the heritageClauses.
        if (node.kind === ts.SyntaxKind.HeritageClause) {
            this.heritageClauses = this.getHeritageMembers(node as ts.HeritageClause);
        } else if (this.heritageClauses && (node.kind === ts.SyntaxKind.MethodDeclaration || node.kind === ts.SyntaxKind.PropertyDeclaration)) {
            /// Firstly ensure that we have a name, although I'm not sure how we can be in here if we don't
            if ((node as ts.MethodDeclaration).name) {
                
                /// Validate that we're actually overriding something
                if (this.heritageClauses.indexOf((node as ts.MethodDeclaration).name.getText()) > -1) {
                    /// Loop the decorators, if we have none then it's a failure
                    if (node.decorators) {
                        for (const decorator of node.decorators) {
                            if (decorator.getText() === "@override") {
                                return;
                            }
                        }
                        
                        /// If we're down here then override isn't declared and this is means to fail
                        this.addFailureAtNode(node, Rule.FAILURE_MISSING_OVERRIDE_STRING);
                    } else {
                        this.addFailureAtNode(node, Rule.FAILURE_MISSING_OVERRIDE_STRING);
                    }
                }
                /// Otherwise do the inverse check
                else {
                    /// If no decorators then move on
                    if (node.decorators) {
                        for (const decorator of node.decorators) {
                            if (decorator.getText() === "@override") {
                                return this.addFailureAtNode(node, Rule.FAILURE_UNNESSESARY_OVERRIDE_STRING);
                            }
                        }
                    }
                }
            }
        } else {
            ts.forEachChild(node, this.visitNode.bind(this))
        }
    }
    
    /**
     * Returns all of our heritage members, recursively
     * @param heritageClause 
     */
    private getHeritageMembers(heritageClause: ts.HeritageClause) {
        let result: string[] = [];
        
        /// Ensure that we actually have some types on this clause, this would be null if we're not extending
        if (heritageClause.types) {
            // console.log(`${heritageClause.parent.name.getText()} is extending from ${heritageClause.types[0].getText()}`);

            /// Grab the real type from each of these clauses
            for (const type of heritageClause.types) {
                const resolvedType = this.options.getTypeFromTypeNode(type)
                
                /// Simple validate to ensure that this is a real type node
                if (isTypeReference(resolvedType)) {
                    const declarations = resolvedType.target.symbol.declarations
                    // console.log(`${resolvedType.target.symbol.name} has ${declarations.length} declarations`);
                    
                    /// Go through each of the declarations that we have, these are essentially the exports
                    for (const dc of declarations) {
                        // console.log(`Declaration: ${this.options.getFullyQualifiedName(this.options.getTypeAtLocation(dc).symbol)}`);

                        /// Validate this declaration is a class, we're not interested in anything else
                        if (isClassDeclaration(dc)) {
                            
                            /// Pull off all of the members properties and methods
                            for (const mb of dc.members) {
                                
                                /// Constructor doesn't need override
                                /// Static doesn't need override
                                if (mb.kind !== ts.SyntaxKind.Constructor &&
                                    (mb.modifiers && mb.modifiers.filter(m => m.getText() === "static").length === 0)) {
                                    // if (mb.modifiers) {
                                    //     console.log(`Found ${ts.SyntaxKind[mb.modifiers[0].kind]} ${ts.SyntaxKind[mb.kind]} ${mb.name.getText()}`);
                                    // } else {
                                    //     console.log(`Found Public ${ts.SyntaxKind[mb.kind]} ${mb.name.getText()}`);
                                    // }

                                    result.push(mb.name.getText());
                                }
                            }
                            
                            /// If the declaration itself has more heritage, go and get them
                            if (dc.heritageClauses) {
                                result = result.concat(this.getHeritageMembers(dc.heritageClauses[0]));
                            }
                        }
                    }
                }
            }
        }
        
        return result;
    }
}