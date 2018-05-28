import * as ts from "typescript";
import * as Lint from "tslint";

/**
 * Rule to force override decorator
 */
export class Rule extends Lint.Rules.AbstractRule {

    /**
     * Meta data around the rule
     */
    public static metadata: Lint.IRuleMetadata = {
        ruleName: "no-any-workaround",
        description: "Blocks work arounds for the 'any' keyword to enforce typing, as well as blocking the 'any' keyword",
        descriptionDetails: "",
        rationale: Lint.Utils.dedent`
            One of the primary benefits of TypeScript is the typing system. You should not try to work around it.`,
        optionsDescription: "Not configurable.",
        options: null,
        optionExamples: [],
        type: "maintainability",
        typescriptOnly: true,
    };

    /**
     * Failure string
     */
    public static FAILURE_STRING = "The 'any' keyword and workarounds are blocked. Interfaces, properties and parameters must be typed.";

    /**
     * Implements the walker
     * @param sourceFile 
     */
    @override public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
        return this.applyWithWalker(new NoAnyWorkaroundWalker(sourceFile, this.ruleName, null));
    }
}

/**
 * Fixes workarounds for 'any' keyword
 */
class NoAnyWorkaroundWalker extends Lint.AbstractWalker<null> {

    /**
     * 
     * @param sourceFile 
     */
    @override public walk(sourceFile: ts.SourceFile) {
        return ts.forEachChild(sourceFile, this.visitNode.bind(this));
    }
    
    /**
     * 
     * @param node 
     */
    private visitNode(node: ts.Node) {        
        /// 'any' is just blanket blocked
        if (node.kind === ts.SyntaxKind.AnyKeyword) {
            this.addFailureAtNode(node, Rule.FAILURE_STRING);
        }
        /// 'Object' as a TypeReference is blocked
        else if (node.kind === ts.SyntaxKind.TypeReference) {
            if (node.getText().indexOf("Object") > -1) {
                this.addFailureAtNode(node, Rule.FAILURE_STRING);
            }
        }
        /// '{}' literal expressions are blocked
        else if (node.kind === ts.SyntaxKind.ObjectLiteralExpression || node.kind === ts.SyntaxKind.TypeLiteral) {
            if (node.getText() === "{}" || node.getText() === "{ }" || node.getText().indexOf("Object") > -1) {
                this.addFailureAtNode(node, Rule.FAILURE_STRING);
            }
        }    
        /// Otherwise continue down
        else {
            return ts.forEachChild(node, this.visitNode.bind(this));
        }
    }
}