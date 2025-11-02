class GF256 {
  constructor() {
    // GF(256) with primitive polynomial x^8 + x^4 + x^3 + x^2 + 1 (0x11D)
    this.polynomial = 0x11d;
    this.exp_table = new Array(512);
    this.log_table = new Array(256);
    this._buildTables();
  }

  _buildTables() {
    let x = 1;
    for (let i = 0; i < 255; i++) {
      this.exp_table[i] = x;
      this.log_table[x] = i;
      x <<= 1;
      if (x & 0x100) {
        x ^= this.polynomial;
      }
    }
    // Extend exp table for convenience
    for (let i = 255; i < 512; i++) {
      this.exp_table[i] = this.exp_table[i - 255];
    }
    this.log_table[0] = 0; // Special case
  }

  multiply(a, b) {
    if (a === 0 || b === 0) return 0;
    return this.exp_table[this.log_table[a] + this.log_table[b]];
  }

  divide(a, b) {
    if (a === 0) return 0;
    if (b === 0) throw new Error('Division by zero');
    return this.exp_table[this.log_table[a] - this.log_table[b] + 255];
  }

  power(base, exp) {
    if (base === 0) return 0;
    return this.exp_table[(this.log_table[base] * exp) % 255];
  }

  inverse(a) {
    if (a === 0) throw new Error('Cannot invert zero');
    return this.exp_table[255 - this.log_table[a]];
  }
}
