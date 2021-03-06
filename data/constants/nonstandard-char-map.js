
// Lots of articles like to use unicode characters that are not on standard keyboards.
// This is a map from those non standard characters to typable ones.
var CharMap = {
    '‘': ["'"],
    '’': ["'"],
    '\u00A0': ['\r', '\n', '\t', '\v', ' '],
    ' ': ['\r', '\n', '\t', '\v', ' ', '\u00A0'],
    '\n': [' ', '\r', '\t', '\v', '\u00A0'],
    '\r': [' ', '\n', '\t', '\v', '\u00A0'],
    '\t': [' ', '\r', '\n', '\v', '\u00A0'],
    '\v': ['\r', '\n', '\t', ' ', '\u00A0'],
    '¡': ['i'],
    '¦': ['|'],
    '¢': ['c'],
    '£': ['E'],
    '¤': ['o', '0'],
    '¥': ['v', 'y', 'Y'],
    '§': ['S', 's'],
    '©': ['c', 'C'],
    'ª': ['a'],
    '¬': ['!'],
    '®': ['r', 'R'],
    '¯': ['-'],
    '°': ['o', '0'],
    '±': ['+'],
    '²': ['2'],
    '³': ['3'],
    '´': ["'"],
    'µ': ['u'],
    '¶': [' ', '\n', '\r', '\t'],
    '·': ['.'],
    '¸': [','],
    '¹': ['1'],
    'º': ['o', '0'],
    '¿': ['?'],
    'À': ['A'],
    'Á': ['A'],
    'Â': ['A'],
    'Ã': ['A'],
    'Ä': ['A'],
    'Å': ['A'],
    'Æ': ['A', 'E'],
    'Ç': ['C'],
    'È': ['E'],
    'É': ['E'],
    'Ê': ['E'],
    'Ë': ['E'],
    'Ì': ['I'],
    'Í': ['I'],
    'Î': ['I'],
    'Ï': ['I'],
    'Ð': ['D'],
    'Ñ': ['N'],
    'Ò': ['O'],
    'Ó': ['O'],
    'Ô': ['O'],
    'Õ': ['O'],
    'Ö': ['O'],
    '×': ['x'],
    'Ø': ['O', '0'],
    'Ù': ['U'],
    'Ú': ['U'],
    'Û': ['U'],
    'Ü': ['U'],
    'Ý': ['Y'],
    'Þ': ['b', 'd', 'p'],
    'ß': ['B'],
    'à': ['a'],
    'á': ['a'],
    'â': ['a'],
    'ã': ['a'],
    'ä': ['a'],
    'å': ['a'],
    'æ': ['a', 'e'],
    'ç': ['c'],
    'è': ['e'],
    'é': ['e'],
    'ê': ['e'],
    'ë': ['e'],
    'ì': ['i'],
    'í': ['i'],
    'î': ['i'],
    'ï': ['i'],
    'ð': ['o', '0'],
    'ñ': ['n'],
    'ò': ['o'],
    'ó': ['o'],
    'ô': ['o'],
    'õ': ['o'],
    'ö': ['o'],
    '÷': ['/'],
    'ø': ['o', '0'],
    'ù': ['u'],
    'ú': ['u'],
    'û': ['u'],
    'ü': ['u'],
    'ý': ['y'],
    'þ': ['b'],
    'ÿ': ['y'],
    'Œ': ['O', 'C', 'E'],
    'œ': ['o', 'c', 'e'],
    'Š': ['S'],
    'š': ['s'],
    'Ÿ': ['Y'],
    'ƒ': ['f'],
    '–': ['-'],
    '—': ['-'],
    '‚': [','],
    '“': ['"'],
    '”': ['"'],
    '†': ['t', '+'],
    '‡': ['t', '+'],
    'ˆ': ['^'],
    '•': ['.'],
    '‰': ['%'],
    '€': ['E'],
    '‹': ['<'],
    '›': ['>'],
    '˜': ['~']
};
