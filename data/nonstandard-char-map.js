
// Lots of articles like to use unicode characters that are not on standard keyboards.
// This is a map from those non standard characters to typable ones.
var CharMap = {
    '‘': "'",
    '’': "'",
    ' ': '\r',
    ' ': '\n',
    '\n': ' ',
    '\r': ' ',
    '\t': ' ',
    '¡': 'i',
    '¢': 'c',
    '£': 'E',
    '¤': 'o',
    '¥': 'v',
    '§': 'S',
    '©': 'c',
    'ª': 'a',
    '¬': '!',
    '®': 'r',
    '¯': '-',
    '°': 'o',
    '±': '+',
    '²': '2',
    '³': '3',
    '´': "'",
    'µ': 'u',
    '¶': ' ',
    '·': '.',
    '¸': ',',
    '¹': '1',
    'º': 'o',
    '¿': '?',
    'À': 'A',
    'Á': 'A',
    'Â': 'A',
    'Ã': 'A',
    'Ä': 'A',
    'Å': 'A',
    'Æ': 'A',
    'Ç': 'C',
    'È': 'E',
    'É': 'E',
    'Ê': 'E',
    'Ë': 'E',
    'Ì': 'I',
    'Í': 'I',
    'Î': 'I',
    'Ï': 'I',
    'Ð': 'D',
    'Ñ': 'N',
    'Ò': 'O',
    'Ó': 'O',
    'Ô': 'O',
    'Õ': 'O',
    'Ö': 'O',
    '×': 'x',
    'Ø': 'O',
    'Ù': 'U',
    'Ú': 'U',
    'Û': 'U',
    'Ü': 'U',
    'Ý': 'Y',
    'Þ': 'b',
    'ß': 'B',
    'à': 'a',
    'á': 'a',
    'â': 'a',
    'ã': 'a',
    'ä': 'a',
    'å': 'a',
    'æ': 'e',
    'ç': 'c',
    'è': 'e',
    'é': 'e',
    'ê': 'e',
    'ë': 'e',
    'ì': 'i',
    'í': 'i',
    'î': 'i',
    'ï': 'i',
    'ð': 'o',
    'ñ': 'n',
    'ò': 'o',
    'ó': 'o',
    'ô': 'o',
    'õ': 'o',
    'ö': 'o',
    '÷': '/',
    'ø': 'o',
    'ù': 'u',
    'ú': 'u',
    'û': 'u',
    'ü': 'u',
    'ý': 'y',
    'þ': 'b',
    'ÿ': 'y',
    'Œ': 'O',
    'œ': 'o',
    'Š': 'S',
    'š': 's',
    'Ÿ': 'Y',
    'ƒ': 'f',
    '–': '-',
    '—': '-',
    '‚': ',',
    '“': '"',
    '”': '"',
    '„': ',',
    '†': 't',
    '‡': 't',
    '•': '.',
    '‰': '%',
    '€': 'E'
};
