/**
 * Safe deterministic mathematics parser and function plotting engine.
 * Does NOT use eval() or new Function(). Uses safe recursive-descent tokenization and evaluation.
 */

export interface PlotPoint {
  x: number;
  y: number;
  canvasX: number;
  canvasY: number;
}

export interface MathPlotData {
  points: PlotPoint[];
  pathD: string;
  hasError: boolean;
  errorMessage?: string;
  minY: number;
  maxY: number;
}

export type MathVisualModel = 'curve' | 'tangent' | 'wave' | 'exponential' | 'integral' | 'number-line' | 'none';

type TokenType = 'NUMBER' | 'VAR' | 'OP' | 'LPAREN' | 'RPAREN' | 'FUNC';

interface Token {
  type: TokenType;
  value: string;
  num?: number;
}

const SUPPORTED_FUNCS = new Set(['sin', 'cos', 'tan', 'sqrt', 'abs', 'exp', 'ln', 'log']);

export function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const clean = expr.trim();

  while (i < clean.length) {
    const ch = clean[i]!;

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    if (/[0-9.]/.test(ch)) {
      let numStr = '';
      while (i < clean.length && /[0-9.]/.test(clean[i]!)) {
        numStr += clean[i];
        i++;
      }
      tokens.push({ type: 'NUMBER', value: numStr, num: parseFloat(numStr) });
      continue;
    }

    if (/[a-zA-Z]/.test(ch)) {
      let name = '';
      while (i < clean.length && /[a-zA-Z0-9]/.test(clean[i]!)) {
        name += clean[i];
        i++;
      }
      const lower = name.toLowerCase();
      if (lower === 'x') {
        tokens.push({ type: 'VAR', value: 'x' });
      } else if (lower === 'pi') {
        tokens.push({ type: 'NUMBER', value: 'pi', num: Math.PI });
      } else if (lower === 'e') {
        tokens.push({ type: 'NUMBER', value: 'e', num: Math.E });
      } else if (SUPPORTED_FUNCS.has(lower)) {
        tokens.push({ type: 'FUNC', value: lower });
      } else {
        // Unknown identifier, default to var or error
        tokens.push({ type: 'VAR', value: lower });
      }
      continue;
    }

    if (ch === '+' || ch === '-' || ch === '*' || ch === '/' || ch === '^' || ch === '×') {
      const op = ch === '×' ? '*' : ch;
      tokens.push({ type: 'OP', value: op });
      i++;
      continue;
    }

    if (ch === '(') {
      tokens.push({ type: 'LPAREN', value: '(' });
      i++;
      continue;
    }

    if (ch === ')') {
      tokens.push({ type: 'RPAREN', value: ')' });
      i++;
      continue;
    }

    i++;
  }

  return tokens;
}

interface ASTNode {
  type: 'num' | 'var' | 'binop' | 'unary' | 'call';
  value?: string;
  num?: number;
  left?: ASTNode;
  right?: ASTNode;
  arg?: ASTNode;
}

class Parser {
  private pos = 0;
  constructor(private tokens: Token[]) {}

  parse(): ASTNode {
    this.pos = 0;
    const node = this.parseExpr();
    if (this.pos < this.tokens.length) {
      throw new Error(`Unexpected token at position ${this.pos}: ${this.tokens[this.pos]?.value}`);
    }
    return node;
  }

  private parseExpr(): ASTNode {
    let node = this.parseTerm();
    while (this.pos < this.tokens.length) {
      const tok = this.tokens[this.pos];
      if (tok && tok.type === 'OP' && (tok.value === '+' || tok.value === '-')) {
        this.pos++;
        const right = this.parseTerm();
        node = { type: 'binop', value: tok.value, left: node, right };
      } else {
        break;
      }
    }
    return node;
  }

  private parseTerm(): ASTNode {
    let node = this.parseFactor();
    while (this.pos < this.tokens.length) {
      const tok = this.tokens[this.pos];
      if (tok && tok.type === 'OP' && (tok.value === '*' || tok.value === '/')) {
        this.pos++;
        const right = this.parseFactor();
        node = { type: 'binop', value: tok.value, left: node, right };
      } else {
        break;
      }
    }
    return node;
  }

  private parseFactor(): ASTNode {
    let node = this.parsePrimary();
    while (this.pos < this.tokens.length) {
      const tok = this.tokens[this.pos];
      if (tok && tok.type === 'OP' && tok.value === '^') {
        this.pos++;
        const right = this.parsePrimary();
        node = { type: 'binop', value: '^', left: node, right };
      } else {
        break;
      }
    }
    return node;
  }

  private parsePrimary(): ASTNode {
    const tok = this.tokens[this.pos];
    if (!tok) throw new Error('Unexpected end of formula');

    if (tok.type === 'OP' && tok.value === '-') {
      this.pos++;
      const arg = this.parsePrimary();
      return { type: 'unary', value: '-', arg };
    }

    if (tok.type === 'NUMBER') {
      this.pos++;
      return { type: 'num', num: tok.num ?? 0 };
    }

    if (tok.type === 'VAR') {
      this.pos++;
      return { type: 'var', value: tok.value };
    }

    if (tok.type === 'FUNC') {
      this.pos++;
      if (this.tokens[this.pos]?.type === 'LPAREN') {
        this.pos++;
        const arg = this.parseExpr();
        if (this.tokens[this.pos]?.type === 'RPAREN') {
          this.pos++;
        }
        return { type: 'call', value: tok.value, arg };
      }
      const arg = this.parsePrimary();
      return { type: 'call', value: tok.value, arg };
    }

    if (tok.type === 'LPAREN') {
      this.pos++;
      const node = this.parseExpr();
      if (this.tokens[this.pos]?.type === 'RPAREN') {
        this.pos++;
      }
      return node;
    }

    throw new Error(`Unexpected token: ${tok.value}`);
  }
}

function evaluateAST(node: ASTNode, xVal: number): number {
  switch (node.type) {
    case 'num':
      return node.num ?? 0;
    case 'var':
      return xVal;
    case 'unary': {
      const v = evaluateAST(node.arg!, xVal);
      return -v;
    }
    case 'binop': {
      const l = evaluateAST(node.left!, xVal);
      const r = evaluateAST(node.right!, xVal);
      switch (node.value) {
        case '+': return l + r;
        case '-': return l - r;
        case '*': return l * r;
        case '/': return r === 0 ? NaN : l / r;
        case '^': return Math.pow(l, r);
        default: return 0;
      }
    }
    case 'call': {
      const a = evaluateAST(node.arg!, xVal);
      switch (node.value) {
        case 'sin': return Math.sin(a);
        case 'cos': return Math.cos(a);
        case 'tan': return Math.tan(a);
        case 'sqrt': return a < 0 ? NaN : Math.sqrt(a);
        case 'abs': return Math.abs(a);
        case 'exp': return Math.exp(a);
        case 'ln':
        case 'log': return a <= 0 ? NaN : Math.log(a);
        default: return a;
      }
    }
  }
}

/**
 * Safely compiles and evaluates an expression at given x without eval()
 */
export function evaluateMathExpression(expr: string, x: number): { value: number; error?: string } {
  try {
    const tokens = tokenize(expr);
    if (!tokens.length) return { value: 0 };
    const parser = new Parser(tokens);
    const ast = parser.parse();
    const result = evaluateAST(ast, x);
    if (isNaN(result) || !isFinite(result)) {
      return { value: 0, error: 'Undefined value at this point' };
    }
    return { value: result };
  } catch (err) {
    return { value: 0, error: err instanceof Error ? err.message : 'Invalid expression' };
  }
}

/**
 * Numerically approximates derivative f'(x)
 */
export function computeSlope(expr: string, x: number): number {
  const h = 0.0001;
  const y1 = evaluateMathExpression(expr, x + h).value;
  const y0 = evaluateMathExpression(expr, x - h).value;
  const slope = (y1 - y0) / (2 * h);
  return isFinite(slope) ? slope : 0;
}

/**
 * Sample mathematical curve points mapped to SVG viewport
 */
export function generatePlotData(
  expression: string,
  options: {
    minX?: number;
    maxX?: number;
    steps?: number;
    viewWidth?: number;
    viewHeight?: number;
    minY?: number;
    maxY?: number;
  } = {}
): MathPlotData {
  const minX = options.minX ?? -3;
  const maxX = options.maxX ?? 3;
  const steps = options.steps ?? 60;
  const viewWidth = options.viewWidth ?? 390;
  const viewHeight = options.viewHeight ?? 240;
  const minY = options.minY ?? -1;
  const maxY = options.maxY ?? 9;

  let ast: ASTNode | null = null;
  try {
    const tokens = tokenize(expression);
    if (tokens.length) {
      ast = new Parser(tokens).parse();
    }
  } catch (e) {
    return {
      points: [],
      pathD: 'M 80 45 Q 195 325 310 45', // Default curve fallback
      hasError: true,
      errorMessage: e instanceof Error ? e.message : 'Syntax error in expression',
      minY,
      maxY,
    };
  }

  const points: PlotPoint[] = [];
  const dx = (maxX - minX) / steps;

  for (let i = 0; i <= steps; i++) {
    const x = minX + i * dx;
    let y = 0;
    try {
      y = ast ? evaluateAST(ast, x) : x * x;
    } catch {
      y = NaN;
    }

    if (!isNaN(y) && isFinite(y)) {
      // Map x from [minX, maxX] to [0, viewWidth]
      const canvasX = ((x - minX) / (maxX - minX)) * viewWidth;
      // Map y from [minY, maxY] to [viewHeight, 0] (SVG y coordinates inverted)
      const canvasY = viewHeight - ((y - minY) / (maxY - minY)) * viewHeight;
      // Clamp canvas bounds reasonably
      const clampedY = Math.max(-50, Math.min(viewHeight + 50, canvasY));
      points.push({ x, y, canvasX, canvasY: clampedY });
    }
  }

  if (points.length < 2) {
    return {
      points: [],
      pathD: 'M 80 45 Q 195 325 310 45',
      hasError: true,
      errorMessage: 'No continuous points calculated',
      minY,
      maxY,
    };
  }

  // Build SVG path
  let pathD = `M ${points[0]!.canvasX.toFixed(1)} ${points[0]!.canvasY.toFixed(1)}`;
  for (let i = 1; i < points.length; i++) {
    pathD += ` L ${points[i]!.canvasX.toFixed(1)} ${points[i]!.canvasY.toFixed(1)}`;
  }

  return {
    points,
    pathD,
    hasError: false,
    minY,
    maxY,
  };
}
