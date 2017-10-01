import * as ts from "typescript";
import * as Lint from "tslint";

/**
 * Rule to allow only a single export per file
 */
export class Rule extends Lint.Rules.AbstractRule {
    
    /**
     * Meta data around the rule
     */
    public static metadata: Lint.IRuleMetadata = {
        ruleName: "single-export",
        description: "Disallows multiple exports in both namespace and ES6 module formats.",
        descriptionDetails: "for discoverability only one export per file",
        rationale: Lint.Utils.dedent`
            Named exports can only be used once per file.`,
        optionsDescription: "Not configurable.",
        options: null,
        optionExamples: [true],
        type: "maintainability",
        typescriptOnly: false,
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
        return this.applyWithWalker(new SingleExportWalker(sourceFile, this.getOptions()));
    }
}

// The walker takes care of all the work.
class SingleExportWalker extends Lint.RuleWalker {
    
    
    /**
     * Static init for performance
     */
    protected static SInit = (() => {
        SingleExportWalker.prototype.exportCount = 0;
    })();
    
    
    /**
     * Current export count
     */
    private exportCount: number;
    
    
    /**
     * Visit each identifier given export assignment does not pickup those that are also identifiers
     * @param node 
     */
    public visitIdentifier(node: ts.Identifier) {
        /// Find the node that contains the export declaration
        let targetNode: ts.Node = node;
        while (targetNode.kind === ts.SyntaxKind.Identifier ||
            targetNode.kind === ts.SyntaxKind.VariableDeclaration ||
            targetNode.kind === ts.SyntaxKind.VariableDeclarationList) {
            targetNode = targetNode.parent;
        }
        
        /// Match it for export with a space as long as it's not a module declaration
        if (targetNode.kind !== ts.SyntaxKind.ModuleDeclaration && targetNode.getText().match(/export\s/)) {
            /// Increase count and validate
            this.exportCount++;
            this.validate(targetNode);
        }
        
        /// Super and move along
        super.visitIdentifier(node);
    }
    
    
    /**
     * Validates to see if we have broken the rule
     * @param node 
     */
    private validate(node: ts.Node) {
        if (this.exportCount > 1) {
            this.addFailure(this.createFailure(node.getStart(), node.getWidth(), `${Rule.FAILURE_STRING} (Additional ${ts.SyntaxKind[node.kind]} Found)`));
        }
    }
}