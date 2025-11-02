import { GF256 as gf } from './GF256';

export class CauchyRS {
  constructor(k, n, alphabetSize = 72) {
    this.k = k; // data symbols
    this.n = n; // total symbols
    this.alphabetSize = alphabetSize;
    this.generatorMatrix = this._generateCauchyMatrix();
  }

  _generateCauchyMatrix() {
    const parityCount = this.n - this.k;
    const matrix = [];

    // Generate distinct field elements for x and y
    const x = Array.from({ length: this.k }, (_, i) => i + 1);
    const y = Array.from({ length: parityCount }, (_, i) => i + this.k + 1);

    for (let i = 0; i < parityCount; i++) {
      const row = [];
      for (let j = 0; j < this.k; j++) {
        // Cauchy matrix element: 1/(x[j] + y[i])
        const denominator = x[j] ^ y[i]; // XOR for addition in GF(2^m)
        row.push(gf.inverse(denominator));
      }
      matrix.push(row);
    }

    return matrix;
  }

  encode(dataSymbols) {
    if (dataSymbols.length !== this.k) {
      throw new Error(
        `Expected ${this.k} data symbols, got ${dataSymbols.length}`
      );
    }

    // Convert characters to field elements
    const data = dataSymbols.map(
      char => char.charCodeAt(0) % this.alphabetSize
    );

    // Calculate parity symbols
    const parity = [];
    for (let i = 0; i < this.generatorMatrix.length; i++) {
      let paritySymbol = 0;
      for (let j = 0; j < this.k; j++) {
        paritySymbol ^= gf.multiply(this.generatorMatrix[i][j], data[j]);
      }
      parity.push(paritySymbol);
    }

    // Return systematic code: [data | parity]
    return [...data, ...parity];
  }

  decode(receivedSymbols, erasurePositions) {
    if (erasurePositions.length > this.n - this.k) {
      throw new Error('Too many erasures to correct');
    }

    // Find available positions
    const availablePositions = [];
    for (let i = 0; i < this.n; i++) {
      if (!erasurePositions.includes(i)) {
        availablePositions.push(i);
      }
    }

    if (availablePositions.length < this.k) {
      throw new Error('Need at least k symbols to decode');
    }

    // Use first k available symbols
    const usePositions = availablePositions.slice(0, this.k);

    // If we only have data symbols, return them directly
    if (usePositions.every(pos => pos < this.k)) {
      return usePositions.map(pos => receivedSymbols[pos]);
    }

    // Build decoding matrix
    const decodeMatrix = this._buildDecodeMatrix(usePositions);
    const receivedSubset = usePositions.map(pos => receivedSymbols[pos]);

    // Solve linear system
    return this._solveLinearSystem(decodeMatrix, receivedSubset);
  }

  _buildDecodeMatrix(positions) {
    const matrix = [];

    for (const pos of positions) {
      if (pos < this.k) {
        // Data position - identity row
        const row = new Array(this.k).fill(0);
        row[pos] = 1;
        matrix.push(row);
      } else {
        // Parity position - generator matrix row
        matrix.push([...this.generatorMatrix[pos - this.k]]);
      }
    }

    return matrix;
  }

  _solveLinearSystem(matrix, vector) {
    const n = matrix.length;
    const augmented = matrix.map((row, i) => [...row, vector[i]]);

    // Gaussian elimination
    for (let i = 0; i < n; i++) {
      // Find pivot
      let pivotRow = i;
      for (let j = i + 1; j < n; j++) {
        if (augmented[j][i] !== 0) {
          pivotRow = j;
          break;
        }
      }

      if (augmented[pivotRow][i] === 0) {
        throw new Error('Matrix is singular');
      }

      // Swap rows
      [augmented[i], augmented[pivotRow]] = [augmented[pivotRow], augmented[i]];

      // Scale pivot row
      const pivot = augmented[i][i];
      const pivotInv = gf.inverse(pivot);
      for (let j = 0; j <= n; j++) {
        augmented[i][j] = gf.multiply(augmented[i][j], pivotInv);
      }

      // Eliminate column
      for (let j = 0; j < n; j++) {
        if (j !== i && augmented[j][i] !== 0) {
          const factor = augmented[j][i];
          for (let k = 0; k <= n; k++) {
            augmented[j][k] ^= gf.multiply(factor, augmented[i][k]);
          }
        }
      }
    }

    return augmented.map(row => row[n]);
  }
}
