import StmtInstruction = require("fx/StmtInstruction");

/**
 * Represent empty statement only semicolon ;
 * ;
 */
class SemicolonStmtInstruction extends StmtInstruction {
    constructor() {
        super();
        this._pInstructionList = null;
        this._eInstructionType = EAFXInstructionTypes.k_SemicolonStmtInstruction;
    }

    toFinalCode(): string {
        return ";";
    }
}

export = SemicolonStmtInstruction;
