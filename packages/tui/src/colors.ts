const enabled = !process.env.NO_COLOR && process.stdout.isTTY !== false;

function code(open: number, close: number) {
  return (str: string) => (enabled ? `\x1b[${open}m${str}\x1b[${close}m` : str);
}

export const c = {
  reset: code(0, 0),
  bold: code(1, 22),
  dim: code(2, 22),
  italic: code(3, 23),
  underline: code(4, 24),

  black: code(30, 39),
  red: code(31, 39),
  green: code(32, 39),
  yellow: code(33, 39),
  blue: code(34, 39),
  magenta: code(35, 39),
  cyan: code(36, 39),
  white: code(37, 39),
  gray: code(90, 39),

  bgCyan: code(46, 49),
  bgMagenta: code(45, 49),
  bgBlue: code(44, 49),
  bgDark: code(100, 49),
};
