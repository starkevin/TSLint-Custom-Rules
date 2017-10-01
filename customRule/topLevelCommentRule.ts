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
        ruleName: "top-level-comment",
        description: "All top level exports must have comments",
        descriptionDetails: "for discoverability each file needs to have detail attached to it at the top level",
        rationale: Lint.Utils.dedent`
            Any exported file should have a description for what it is used for in order to speed up discoverability, as well
            an understanding on whether or not the class can be reused`,
        optionsDescription: "Not configurable.",
        options: [50, true],
        type: "maintainability",
        typescriptOnly: false,
    };

    /**
     * Failure string
     */
    public static FAILURE_STRING = "Top level implementations must have a JSDoc comment";

    /**
     * Failure string
     */
    public static FAILURE_BLANK_STRING = "Top level implementations must have a human understandable JSDoc comment";

    /**
     * Failure string
     */
    public static FAILURE_SHORT_STRING = "Top level implementations must have a JSDoc comment of meaningful length";

    /**
     * Implements the walker
     * @param sourceFile 
     */
    public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
        return this.applyWithWalker(new TopLevelCommentWalker(sourceFile, this.getOptions()));
    }
}

// The walker takes care of all the work.
class TopLevelCommentWalker extends Lint.RuleWalker {
    
    /**
     * Min length
     */
    private commentMinimumLength: number;
    
    /**
     * Empty comment blocks
     */
    private noEmptyComment: boolean;
    
    
    /**
     * Static init -- Performance
     */
    protected static SInit = (() => {
        TopLevelCommentWalker.prototype.commentMinimumLength = 0;
        TopLevelCommentWalker.prototype.noEmptyComment = false;
    })();
    
    
    /**
     * Creation
     * @param sourceFile 
     * @param options 
     */
    constructor(sourceFile: ts.SourceFile, options: Lint.IOptions) {
        super(sourceFile, options);
        
        let internalOptions: any[];
        if (internalOptions = this.getOptions()) {
            this.commentMinimumLength = internalOptions[0];
            this.noEmptyComment = internalOptions[1];
        }
    }
    

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
            this.validate(targetNode as JSDocNode);
        }

        /// Super and move along
        super.visitIdentifier(node);
    }

    /**
     * Validates to see if we have broken the rule
     * @param node 
     */
    private validate(node: JSDocNode) {        
        /// Validate that we have a doc
        if (!node.jsDoc) {
            this.addFailure(this.createFailure(node.getStart(), node.getWidth(), `${Rule.FAILURE_STRING}`));
        } else {
            /// blank comment -> error
            if (this.noEmptyComment && !node.jsDoc[0].comment) {
                this.addFailure(this.createFailure(node.getStart(), node.getWidth(), `${Rule.FAILURE_BLANK_STRING}`));
            }
            /// short comment -> error
            else if (this.commentMinimumLength && node.jsDoc[0].comment.length < this.commentMinimumLength) {
                this.addFailure(this.createFailure(node.getStart(), node.getWidth(), `${Rule.FAILURE_SHORT_STRING} (${this.commentMinimumLength} characters)`));
            }
        }
    }
}

/**
 * JSDoc type - Not exported from TypeScript, but nodes implement this
 */
interface JSDocNode extends ts.Node {
    jsDoc: ts.JSDoc[]
}