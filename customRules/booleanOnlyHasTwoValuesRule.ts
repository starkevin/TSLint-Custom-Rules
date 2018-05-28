import * as ts from "typescript";
import * as Lint from "tslint";

/**
 * Rule to force override decorator
 */
export class Rule extends Lint.Rules.TypedRule {

    /**
     * Meta data around the rule
     */
    public static metadata: Lint.IRuleMetadata = {
        ruleName: "boolean-only-has-two-values",
        description: "Booleans are only allowed to be declared and used as true/false",
        descriptionDetails: "",
        rationale: Lint.Utils.dedent`
            In computer science, the Boolean data type is a data type, having two values (usually denoted true and false), intended to represent the truth values of logic and Boolean algebra.`,
        optionsDescription: "Not configurable.",
        options: null,
        optionExamples: [],
        type: "maintainability",
        typescriptOnly: true,
    };

    /**
     * Failure string
     */
    public static FAILURE_STRING = "A variable declaration of a Boolean may only be true or false.";

    /**
     * Failure 2 string
     */
    public static FAILURE_ASSIGNMENT_STRING = "Booleans may only have true or false assigned to them.";

    /**
     * Implements the walker
     * @param sourceFile 
     */
    @override public applyWithProgram(sourceFile: ts.SourceFile, program: ts.Program): Lint.RuleFailure[] {
        return this.applyWithWalker(new BooleanOnlyHasTwoValuesRuleWalker(sourceFile, this.ruleName, program.getTypeChecker()));
    }
}

/**
 * # https://en.wikipedia.org/wiki/Boolean_data_type
 * In computer science, the Boolean data type is a data type, having two values (usually denoted 
 * true and false), intended to represent the truth values of logic and Boolean algebra.
 */
class BooleanOnlyHasTwoValuesRuleWalker extends Lint.AbstractWalker<ts.TypeChecker> {
    
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
        /// Jump in early if it's an assignment, don't need type checker
        if (node.kind === ts.SyntaxKind.VariableDeclaration) {
            const type = (node as ts.TypePredicateNode).type;

            /// If we're at the definition stage then we don't need to interigate the typechecker
            /// Check if the kind of our type is a boolean
            if (type && type.kind === ts.SyntaxKind.BooleanKeyword) {
                /// Grab the assignment value
                const assignmentType = node.getChildren()[node.getChildCount() - 1];

                /// Validate against null and undefined, both live in different places.
                /// Undefined is an identifier, null is a token
                if ((assignmentType as ts.Identifier).originalKeywordKind === ts.SyntaxKind.UndefinedKeyword || assignmentType.kind === ts.SyntaxKind.NullKeyword) {
                    this.addFailureAtNode(node, Rule.FAILURE_STRING);
                }
            }
        }
        /// Otherwise it's probably an assignment and we need the checker
        else if (node.kind === ts.SyntaxKind.Identifier) {
            const type = this.options.getTypeAtLocation(node);
            
            /// Validate that we're a boolean
            if (type && type.flags & ts.TypeFlags.Boolean) {
                /// Grab the assignment value
                const assignmentType = node.parent.getChildren()[node.parent.getChildCount() - 1];

                /// Validate against null and undefined, both live in different places.
                /// Undefined is an identifier, null is a token
                if ((assignmentType as ts.Identifier).originalKeywordKind === ts.SyntaxKind.UndefinedKeyword || assignmentType.kind === ts.SyntaxKind.NullKeyword) {
                    this.addFailureAtNode(node, Rule.FAILURE_ASSIGNMENT_STRING);
                }
            }
        }  
        /// Otherwise continue down
        else {
            return ts.forEachChild(node, this.visitNode.bind(this));
        }
    }
}