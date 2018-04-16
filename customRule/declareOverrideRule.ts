import * as ts from "typescript";
import * as Lint from "tslint";
import { isTypeReference, isClassDeclaration } from "tsutils";

/**
 * Rule to force override decorator
 */
export class Rule extends Lint.Rules.AbstractRule {

    /**
     * Meta data around the rule
     */
    public static metadata: Lint.IRuleMetadata = {
        ruleName: "declare-override",
        description: "Overrides in TypeScript must be declared by the presence of an Override decorator",
        descriptionDetails: "",
        rationale: Lint.Utils.dedent`
            `,
        optionsDescription: "Not configurable.",
        options: null,
        optionExamples: [],
        type: "maintainability",
        typescriptOnly: true,
    };

    /**
     * Failure string
     */
    public static FAILURE_STRING = "Only one export per file is allowed";

    /**
     * Implements the walker
     * @param sourceFile 
     */
    public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
        const program = ts.createProgram(["test/override/bottom.ts", "test/override/middle.ts", "test/override/top.ts"], { target: ts.ScriptTarget.ES2015 });
        const checker = program.getTypeChecker();
        return this.applyWithWalker(new OverrideWalker(checker, program.getSourceFile(sourceFile.fileName), this.ruleName, new Set(this.ruleArguments.map(String))));
    }
}

class OverrideWalker extends Lint.AbstractWalker<Set<string>> {
    
    /**
     * 
     * @param checker 
     * @param file 
     * @param ruleName 
     * @param opts 
     */
    constructor(private checker: ts.TypeChecker, file: ts.SourceFile, ruleName: string, opts: Set<string>) {
        super(file, ruleName, opts);
    }
    
    /**
     * 
     * @param sourceFile 
     */
    public walk(sourceFile: ts.SourceFile) {
        
        const checker = this.checker;
        
        function visitNode(node: ts.Node) {
            if (node.kind === ts.SyntaxKind.HeritageClause) {
                const heritageMembers = getHeritageMembers(node as ts.HeritageClause);
                console.log(heritageMembers);
            }
            
            ts.forEachChild(node, visitNode)
        }

        ts.forEachChild(sourceFile, visitNode);

        function getHeritageMembers(heritageClause: ts.HeritageClause) {
            let result: string[] = [];
            
            if (heritageClause.types) {
                console.log(`${heritageClause.parent.name.getText()} is extending from ${heritageClause.types[0].getText()}`);

                for (const type of heritageClause.types) {
                    const resolvedType = checker.getTypeFromTypeNode(type)

                    if (isTypeReference(resolvedType)) {
                        const declarations = resolvedType.target.symbol.declarations
                        console.log(`${resolvedType.target.symbol.name} has ${declarations.length} declarations`);

                        for (const dc of declarations) {
                            console.log(`Declaration: ${checker.getFullyQualifiedName(checker.getTypeAtLocation(dc).symbol)}`);

                            if (isClassDeclaration(dc)) {

                                for (const mb of dc.members) {
                                    console.log(`Found ${ts.SyntaxKind[mb.modifiers[0].kind]} ${ts.SyntaxKind[mb.kind]} ${mb.name.getText()}`);
                                    result.push(mb.name.getText());
                                }
                                
                                if (dc.heritageClauses) {
                                    result = result.concat(getHeritageMembers(dc.heritageClauses[0]));
                                }
                            }
                        }
                    }
                }
            }
            
            return result;
        }
    }
}