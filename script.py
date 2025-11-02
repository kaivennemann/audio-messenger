import json


def main():
    chars = [
        "a",
        "b",
        "c",
        "d",
        "e",
        "f",
        "g",
        "h",
        "i",
        "j",
        "k",
        "l",
        "m",
        "n",
        "o",
        "p",
        "q",
        "r",
        "s",
        "t",
        "u",
        "v",
        "w",
        "x",
        "y",
        "z",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "0",
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
        "G",
        "H",
        "I",
        "J",
        "K",
        "L",
        "M",
        "N",
        "O",
        "P",
        "Q",
        "R",
        "S",
        "T",
        "U",
        "V",
        "W",
        "X",
        "Y",
        "Z",
        "-",
        "/",
        ".",
        ",",
        "#",
        "$",
        "%",
        "^",
        "&",
        "*",
        "(",
        ")",
        "!",
        "'",
        " ",
        "~",
    ]
    print(len(chars))
    size = len(chars)
    start = "~"

    # valid_hz = list(range(3000, 3000 + 100 * 50, 50))
    valid_hz = list(range(3000, 3000 + (size + 2) * 50, 50))

    # products = list((a, b) for a, b in product(valid_hz, repeat=2) if a != b)
    # for char, (left, right) in zip(chars, products):
    #     frequency_map[char] = [left, right]

    frequency_map = {}

    for i, char in enumerate(chars):
        first = valid_hz[i]
        second = valid_hz[(i + 30) % len(valid_hz)]
        frequency_map[char] = [first, second]
    #

    dump = json.dumps(
        {
            "alphabet": chars,
            "start": start,
            "frequencyMap": frequency_map,
            "valid_hz": valid_hz,
        },
    )
    print(dump)


main()
