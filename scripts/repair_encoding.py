import re

def clean_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    replacements = {
        r'þÒo': 'ção',
        r'þ§es': 'ções',
        r'þÒO': 'ÇÃO',
        r'þ§ES': 'ÇÕES',
        r'þ': 'ç',
        r'Ò': 'ã',
        r'ß': 'á',
        r'Û': 'ê',
        r'Ú': 'é',
        r'Ý': 'í',
        r'¾': 'o',
        r'º': 'u',
        r'ÔöÇÔöÇ': '──',
        r'jß': 'já',
        r'vocÛ': 'você',
        r'AvaliaþÒo': 'Avaliação',
        r'mÚdia': 'média',
        r'Tßtica': 'Tática',
        r'PrecisÒo': 'Precisão',
        r'ObediÛncia': 'Obediência',
        r'AlimentaþÒo': 'Alimentação',
        r'DuraþÒo': 'Duração',
        r'ProteþÒo': 'Proteção',
        r'ReuniÒo': 'Reunião',
        r'í­ƒÅå': '🏆',
        r'í­ƒî┤': '⛱️',
        r'í­ƒôè': '📊',
        r'í­ƒôà': '📅',
        r'mêsg': 'msg',
        r'Nãode': 'Node',
        r'childNãodes': 'childNodes'
    }

    for pattern, rep in replacements.items():
        content = re.sub(pattern, rep, content)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == "__main__":
    clean_file('master_portal_v2.html')
    clean_file('master_app.js')
