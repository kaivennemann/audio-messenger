
const LOWER_LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');
const NUMBER = '1234567890'.split('');
const UPPER_LETTERS = LOWER_LETTERS.map((l) => l.toUpperCase())
const SPECIAL = '-/.,#$%^&*()!\''.split('')

export const ALPHABET = LOWER_LETTERS.concat(NUMBER, UPPER_LETTERS, SPECIAL)