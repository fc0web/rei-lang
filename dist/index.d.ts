interface SigmaMetadata {
    memory: any[];
    tendency: string;
    pipeCount: number;
}
declare class Environment {
    parent: Environment | null;
    bindings: Map<string, {
        value: any;
        mutable: boolean;
    }>;
    constructor(parent?: Environment | null);
    define(name: string, value: any, mutable?: boolean): void;
    get(name: string): any;
    set(name: string, value: any): void;
    has(name: string): boolean;
    getBinding(name: string): any;
    allBindings(): Map<string, {
        value: any;
        mutable: boolean;
    }>;
}
declare class Evaluator {
    env: Environment;
    constructor(parent?: Environment);
    private registerBuiltins;
    eval(ast: any): any;
    private evalProgram;
    private evalConstLit;
    private evalMDimLit;
    private evalSpaceLit;
    private evalLetStmt;
    private evalMutStmt;
    private evalCompressDef;
    private evalBinOp;
    private evalUnaryOp;
    private evalPipe;
    private execPipeCmd;
    private evalFnCall;
    private callFunction;
    private callBuiltin;
    private evalMemberAccess;
    private evalIndexAccess;
    private evalExtend;
    private evalReduce;
    private evalConverge;
    private evalDiverge;
    private evalReflect;
    private evalIfExpr;
    private evalMatchExpr;
    toNumber(val: any): number;
    private isTruthy;
    private matches;
    isObj(v: any): boolean;
    isMDim(v: any): boolean;
    isExt(v: any): boolean;
    isGenesis(v: any): boolean;
    isFunction(v: any): boolean;
    isQuad(v: any): boolean;
    isSpace(v: any): boolean;
    isDNode(v: any): boolean;
    isReiVal(v: any): boolean;
    isStringMDim(v: any): boolean;
    /** 値からσメタデータを取得（Tier 1） */
    getSigmaMetadata(v: any): SigmaMetadata;
    /** ReiValを透過的にアンラップ */
    unwrap(v: any): any;
}

interface Token {
    type: string;
    value: string;
    line: number;
    col: number;
}
declare class Lexer {
    private source;
    private chars;
    private pos;
    private line;
    private col;
    private tokens;
    constructor(source: string);
    tokenize(): Token[];
    private skipWhitespaceAndComments;
    private readString;
    private isExtStart;
    private readExtLit;
    private readNumber;
    private readUnicodeToken;
    private readMultiCharOp;
    private readSingleCharOp;
    private readIdentOrKeyword;
    private advance;
    private peek;
    private emit;
    private isDigit;
    private isIdentStart;
    private isIdentPart;
    private shouldNegateBePrefix;
}

declare class Parser {
    private pos;
    private tokens;
    constructor(tokens: Token[]);
    parseProgram(): any;
    private parseStatement;
    private parseLetStmt;
    private parseCompressDef;
    private parseCompressLevel;
    private parseParamDecl;
    private parseExpression;
    private parsePipe;
    private parsePipeCommand;
    private parseLogicOr;
    private parseLogicAnd;
    private parseComparison;
    private parseAddition;
    private parseMultiplication;
    private parseExtendReduce;
    private parseUnary;
    private parsePostfix;
    private parsePrimary;
    private parseMDimLit;
    private parseSpaceLit;
    private parseIfExpr;
    private parseMatchExpr;
    private peek;
    private isAtEnd;
    private check;
    private checkAhead;
    private advance;
    private match;
    private expect;
    private error;
    private shouldNegateBePrefix;
}

declare function reiFn(source: string): any;
declare namespace reiFn {
    var reset: () => void;
    var evaluator: () => Evaluator;
}
declare const rei: typeof reiFn;

export { Evaluator, Lexer, Parser, rei };
